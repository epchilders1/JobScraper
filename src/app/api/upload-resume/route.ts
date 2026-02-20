import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const VALID_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const profileId = formData.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing resume file" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const prefix = `resumes/${profileId}/`;

  // Delete any existing resumes for this profile
  const list = await s3.send(new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET!,
    Prefix: prefix,
  }));

  if (list.Contents && list.Contents.length > 0) {
    await s3.send(new DeleteObjectsCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Delete: { Objects: list.Contents.map((o) => ({ Key: o.Key! })) },
    }));
  }

  const key = `${prefix}${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  }));

  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return NextResponse.json({ url, key, originalName: file.name });
}