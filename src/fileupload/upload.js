import { Hono } from "hono";
import { handleFileUpload } from "./file-upload-utils.js";

const uploadRoute = new Hono();

uploadRoute.post('/upload', async (c) => {
  const body = await c.req.parseBody();
  const attachment = body['attachment'];  // name must match form field name
  console.log('Received attachment:', attachment);

  if (!attachment || !(attachment instanceof File)) {
    return c.json({ message: 'Attachment is required' }, 400);
  }

  try {
    const uploadResponse = await handleFileUpload(attachment);

    if (uploadResponse) {
      return c.json({
        message: 'File Uploaded Successfully!',
        url: uploadResponse,
      }, 201);
    } else {
      return c.json({ message: 'File Upload Failed' }, 500);
    }
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error.message }, 500);
  }
});

export default uploadRoute;
