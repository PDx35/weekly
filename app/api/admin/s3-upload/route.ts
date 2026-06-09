import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 });
    }

    const region = process.env.S3_REGION || 'us-east-1';
    const bucket = process.env.S3_BUCKET_NAME;

    if (!bucket) {
      return NextResponse.json({ error: 'S3_BUCKET_NAME is not configured' }, { status: 500 });
    }

    // Initialize S3 client using S3_ prefixed env vars (Amplify reserves AWS_ prefix)
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });

    // Generate a unique object key
    const extension = filename.split('.').pop() || '';
    const key = `uploads/${crypto.randomUUID()}-${Date.now()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      // If the bucket has public access, the file will be readable.
      // We don't set ACLs here to avoid issues with modern S3 buckets that enforce Bucket Owner Enforced.
    });

    // Create the presigned URL
    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    // Generate the final public URL. Assuming standard S3 domain structure.
    // If using CloudFront, this would be updated to use the CloudFront domain.
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return NextResponse.json({
      url: presignedUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error generating presigned URL:', message);
    return NextResponse.json({
      error: 'Failed to generate upload URL',
      detail: message,
      env: {
        hasRegion: !!process.env.S3_REGION,
        hasBucket: !!process.env.S3_BUCKET_NAME,
        hasKeyId: !!process.env.S3_ACCESS_KEY_ID,
        hasSecret: !!process.env.S3_SECRET_ACCESS_KEY,
      },
    }, { status: 500 });
  }
}
