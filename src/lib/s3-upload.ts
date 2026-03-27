"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hmacSign(key: any, data: string): Promise<Uint8Array> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (crypto as any).subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then((cryptoKey: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  }).then((signature: ArrayBuffer) => new Uint8Array(signature));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sha256Hash(data: any): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data).buffer : data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hash = await (crypto as any).subtle.digest("SHA-256", buffer);
  return bytesToHex(new Uint8Array(hash));
}

export async function uploadToS3(
  file: File,
  fileName: string
): Promise<string> {
  const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT!;
  const region = process.env.NEXT_PUBLIC_S3_REGION!;
  const accessKey = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!;
  const secretKey = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!;
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET!;

  const objectKey = `photos/${fileName}`;
  const url = `${endpoint}/${bucket}/${objectKey}`;
  const urlObj = new URL(url);
  const host = urlObj.host;
  const canonicalUri = "/" + objectKey;

  const amzDate = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const fileBuffer = await file.arrayBuffer();
  const payloadHash = await sha256Hash(fileBuffer);
  const contentType = file.type || "image/jpeg";

  const headers: Record<string, string> = {
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    "Content-Type": contentType,
    "Host": host,
  };

  const sortedHeaderNames = Object.keys(headers).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const canonicalHeaders = sortedHeaderNames
    .map(k => `${k.toLowerCase()}:${headers[k]}`)
    .join('\n') + '\n';

  const signedHeaders = sortedHeaderNames.map(k => k.toLowerCase()).join(';');

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const canonicalRequestHash = await sha256Hash(canonicalRequest);
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  const kSecret = new TextEncoder().encode('AWS4' + secretKey);
  const kDate = await hmacSign(kSecret, dateStamp);
  const kRegion = await hmacSign(kDate, region);
  const kService = await hmacSign(kRegion, 's3');
  const kSigning = await hmacSign(kService, 'aws4_request');
  const signature = bytesToHex(await hmacSign(kSigning, stringToSign));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      ...headers,
      "Authorization": authHeader,
      "Content-Length": file.size.toString(),
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error("S3 upload error:", response.status, errorText);
    throw new Error(`Upload failed: ${response.status}`);
  }

  return url;
}
