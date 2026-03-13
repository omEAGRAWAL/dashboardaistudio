import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary explicitly
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dtsnvrypk',
  api_key: '417265431864224',
  api_secret: 'j6aoD3rSLo7cHhTsC1svxx1dKEA',
  secure: true
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert the file to a buffer or base64 string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Using Data URI format for Cloudinary upload
    const fileFormat = file.type.split('/')[1] || 'jpeg';
    const b64 = buffer.toString('base64');
    const dataURI = `data:${file.type || 'image/jpeg'};base64,${b64}`;
    
    // Get upload folder from env or default
    const folder = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER || 'atlas-trails';

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
    });

    return NextResponse.json({ secure_url: result.secure_url });
  } catch (error: any) {
    console.error('API Upload error:', error);
    return NextResponse.json({ error: error.message || 'Error uploading file' }, { status: 500 });
  }
}
