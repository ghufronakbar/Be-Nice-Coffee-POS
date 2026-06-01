import { createHash } from "node:crypto"

import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { getCloudinaryClient } from "@/lib/cloudinary"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let imageHash: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File gambar wajib diisi" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "File harus berupa gambar" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const hash = createHash("sha256").update(buffer).digest("hex")
    imageHash = hash

    const existingImage = await prisma.image.findFirst({
      where: {
        hash,
        deletedAt: null,
      },
      select: {
        url: true,
      },
    })

    if (existingImage) {
      return NextResponse.json({ url: existingImage.url, hash, reused: true })
    }

    const cloudinary = getCloudinaryClient()
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`

    const uploadedImage = await cloudinary.uploader.upload(dataUri, {
      folder: "be_nice_coffee",
      resource_type: "image",
      overwrite: false,
    })

    const createdImage = await prisma.image.create({
      data: {
        hash,
        url: uploadedImage.secure_url,
      },
      select: {
        url: true,
      },
    })

    return NextResponse.json({ url: createdImage.url, hash, reused: false })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && imageHash) {
      const existingImage = await prisma.image.findFirst({
        where: {
          hash: imageHash,
          deletedAt: null,
        },
        select: {
          url: true,
        },
      })

      if (existingImage) {
        return NextResponse.json({ url: existingImage.url, hash: imageHash, reused: true })
      }
    }

    const message = error instanceof Error ? error.message : "Gagal mengunggah gambar"
    return NextResponse.json({ message }, { status: 500 })
  }
}
