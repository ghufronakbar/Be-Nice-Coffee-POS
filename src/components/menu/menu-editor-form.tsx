"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"

import { createMaterialFromMenuAction, type MaterialOption } from "@/actions/material"
import {
  createMenuWithRecipesAction,
  updateMenuWithRecipesAction,
} from "@/actions/menu"
import {
  createMaterialQuickSchema,
  menuFormSchema,
  type CreateMaterialQuickInputValues,
  type CreateMaterialQuickValues,
  type MenuFormInputValues,
  type MenuFormValues,
} from "@/components/menu/menu-form-schema"
import { ImageUploader } from "@/components/shared/image-uploader"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { getMaterialUnitLabel, MATERIAL_UNITS } from "@/constants/constants"

type MenuEditorFormProps = {
  mode: "create" | "edit"
  menuId?: number
  materials: MaterialOption[]
  initialValues?: MenuFormInputValues
}

export function MenuEditorForm({ mode, menuId, materials, initialValues }: MenuEditorFormProps) {
  const router = useRouter()

  const [isMenuImageUploading, setIsMenuImageUploading] = useState(false)
  const [isMaterialImageUploading, setIsMaterialImageUploading] = useState(false)
  const [menuMaterials, setMenuMaterials] = useState<MaterialOption[]>(materials)

  const [isSubmittingMenu, startSubmitMenuTransition] = useTransition()
  const [isSubmittingMaterial, startSubmitMaterialTransition] = useTransition()

  const menuForm = useForm<MenuFormInputValues, undefined, MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: initialValues ?? {
      name: "",
      price: 0,
      imageUrl: "",
      recipes: [{ materialId: 0, amount: 1 }],
    },
  })

  const materialForm = useForm<
    CreateMaterialQuickInputValues,
    undefined,
    CreateMaterialQuickValues
  >({
    resolver: zodResolver(createMaterialQuickSchema),
    defaultValues: {
      name: "",
      unit: "GRAM",
      imageUrl: "",
    },
  })

  const recipesFieldArray = useFieldArray({
    control: menuForm.control,
    name: "recipes",
  })

  const availableMaterialOptions = useMemo(
    () => [...menuMaterials].sort((a, b) => a.name.localeCompare(b.name)),
    [menuMaterials]
  )

  const isBusy =
    isSubmittingMenu || isSubmittingMaterial || isMenuImageUploading || isMaterialImageUploading

  const handleSubmitMenu = (values: MenuFormValues) => {
    startSubmitMenuTransition(async () => {
      const result =
        mode === "create"
          ? await createMenuWithRecipesAction(values)
          : await updateMenuWithRecipesAction(menuId ?? 0, values)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)

      if (mode === "create" && result.menuId) {
        router.push(`/dashboard/menu/${result.menuId}`)
        return
      }

      router.refresh()
    })
  }

  const handleSubmitMaterial = (values: CreateMaterialQuickValues) => {
    startSubmitMaterialTransition(async () => {
      const result = await createMaterialFromMenuAction(values)

      if (!result.success || !result.material) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)

      const createdMaterial = result.material

      setMenuMaterials((previous) => {
        if (previous.some((item) => item.id === createdMaterial.id)) {
          return previous
        }

        return [...previous, createdMaterial]
      })

      materialForm.reset({
        name: "",
        unit: "GRAM",
        imageUrl: "",
      })
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {mode === "create" ? "Buat Menu Baru" : "Detail & Edit Menu"}
        </h1>

        <Button asChild variant="outline">
          <Link href="/dashboard/menu">Kembali ke List Menu</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Form Menu</h2>
          <p className="mt-1 text-sm text-zinc-600">Isi data menu dan susun resep per porsi.</p>

          <Form {...menuForm}>
            <form
              onSubmit={menuForm.handleSubmit(handleSubmitMenu)}
              className="mt-5 space-y-5"
            >
              <FormField
                control={menuForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Menu</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Americano Large" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={menuForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="100"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={menuForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gambar Menu</FormLabel>
                    <FormControl>
                      <div>
                        <ImageUploader
                          value={field.value}
                          onChange={(url) => field.onChange(url)}
                          onUploadingChange={setIsMenuImageUploading}
                          disabled={isBusy}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Resep (BOM)</p>
                    <p className="text-xs text-zinc-600">Setiap baris mewakili material untuk 1 porsi menu.</p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => recipesFieldArray.append({ materialId: 0, amount: 1 })}
                    disabled={isBusy}
                  >
                    <PlusIcon className="size-4" />
                    Tambah Baris
                  </Button>
                </div>

                {recipesFieldArray.fields.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-lg border border-zinc-200 p-3 md:grid-cols-[2fr_1fr_auto]">
                    <FormField
                      control={menuForm.control}
                      name={`recipes.${index}.materialId` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material</FormLabel>
                          <FormControl>
                            <NativeSelect
                              className="w-full"
                              value={String(field.value ?? "")}
                              onChange={(event) => field.onChange(Number(event.target.value))}
                            >
                              <NativeSelectOption value="0">Pilih material</NativeSelectOption>
                              {availableMaterialOptions.map((materialOption) => (
                                <NativeSelectOption key={materialOption.id} value={String(materialOption.id)}>
                                  {materialOption.name} ({getMaterialUnitLabel(materialOption.unit)})
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={menuForm.control}
                      name={`recipes.${index}.amount` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jumlah</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={field.value}
                              onChange={(event) => field.onChange(Number(event.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => recipesFieldArray.remove(index)}
                        disabled={isBusy || recipesFieldArray.fields.length <= 1}
                      >
                        <Trash2Icon className="size-4" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={isBusy}>
                {isSubmittingMenu ? "Menyimpan..." : mode === "create" ? "Buat Menu" : "Simpan Perubahan"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Tambah Material Baru</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Tambahkan material baru untuk keperluan recipe dan inventory.
          </p>

          <Form {...materialForm}>
            <form
              onSubmit={materialForm.handleSubmit(handleSubmitMaterial)}
              className="mt-5 space-y-4"
            >
              <FormField
                control={materialForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Material</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Susu UHT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={materialForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan</FormLabel>
                    <FormControl>
                      <NativeSelect
                        className="w-full"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        {MATERIAL_UNITS.map((unitOption) => (
                          <NativeSelectOption key={unitOption.value} value={unitOption.value}>
                            {unitOption.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={materialForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gambar Material</FormLabel>
                    <FormControl>
                      <div>
                        <ImageUploader
                          value={field.value}
                          onChange={(url) => field.onChange(url)}
                          onUploadingChange={setIsMaterialImageUploading}
                          disabled={isBusy}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" variant="outline" disabled={isBusy}>
                {isSubmittingMaterial ? "Menyimpan Material..." : "Tambah Material"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
