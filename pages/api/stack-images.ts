// pages/api/stack-images.ts

import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

type ImageStackRequest = {
  images: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests are allowed" });
  }

  try {
    const { images }: ImageStackRequest = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide an array of image URLs" });
    }

    // Load all images and convert them to buffers
    const imageBuffers = await Promise.all(
      images.map(async (image) => {
        const response = await fetch(image);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${image}`);
        }
        return Buffer.from(await response.arrayBuffer());
      })
    );

    // Start with the first image
    let stackedImage = sharp(imageBuffers[0]);

    // Overlay each subsequent image on top of the first one
    for (let i = 1; i < imageBuffers.length; i++) {
      stackedImage = stackedImage.composite([
        { input: imageBuffers[i], blend: "over" },
      ]);
    }

    const finalImageBuffer = await stackedImage.toBuffer();

    // Set the content-type to image/png and return the image
    res.setHeader("Content-Type", "image/png");
    res.send(finalImageBuffer);
  } catch (error) {
    console.error("Error stacking images:", error);
    res.status(500).json({ message: "Error processing images" });
  }
}
