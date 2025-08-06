import axios from "axios";

export const handleFileUpload = async (file) => {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file object');
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uniqueFileName = `${Date.now()}-${file.name}`;

  const response = await axios.put(
    `https://storage.bunnycdn.com/jumly/${uniqueFileName}`,
    fileBuffer,
    {
      headers: {
        AccessKey: '38c581c6-88dc-4727-954fa389541b-88b4-4f7b',
        'Content-Type': file.type || 'application/octet-stream'
      }
    }
  );

  if (response.status === 201 || response.status === 200) {
    return uniqueFileName;  // or full URL if you prefer
  } else {
    return false;
  }
};
