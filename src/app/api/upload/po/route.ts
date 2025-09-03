import {NextRequest ,NextResponse} from 'next/server';
import { PutObjectCommand} from '@aws-sdk/client-s3';
import crypto from "crypto";
import { minioClient } from '@/lib/minio';

const BUCKET = process.env.MINIO_BUCKET; 

export const runtime = "nodejs"; 

export async function POST(req: NextRequest){
    try{
        const from = await req.formData();
        const poNumber = String(from.get('poNumber'));
        const customerId = String(from.get('customerId'));

        const files = from.getAll('files');

        if(files.length === 0){
            return NextResponse.json({error: 'No files upload'}, {status: 400});
        }
        const uploadedKeys: string[] = [];
        for (const f of files){
            if(!(f instanceof File)) continue;

            const buffer = Buffer.from(await f.arrayBuffer());
            const safeName = f.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const rand = crypto.randomBytes(4).toString("hex");
            const key = `po/${customerId}/${poNumber}/${Date.now()}_${rand}_${safeName}`;

            await minioClient.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                    Body: buffer,
                    ContentType: f.type || 'application/octet-stream',
                })
            );
            uploadedKeys.push(key);
        }
        return NextResponse.json({message: 'Files uploaded successfully', keys: uploadedKeys}, {status: 200});
    } catch (error){
        return NextResponse.json({error:error.message}, {status: 500});
    }
}