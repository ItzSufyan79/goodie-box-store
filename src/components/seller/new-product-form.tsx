"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, categorySchema, type ProductInput } from "@/lib/validations";
import { createCategoryAction, saveCustomFieldsAction, saveProductSizesAction } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface CustomField {
  label: string;
  type: string;
  options: string[];
  required: boolean;
  sortOrder: number;
}

interface SizeEntry {
  label: string;
  price: number;
  sortOrder: number;
}

interface NewProductFormProps {
  categories: { id: string; name: string }[];
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File, maxDim = 1200, quality = 0.8): Promise<File> {
  const img = await createImageBitmap(file);
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  img.close();
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], file.name, { type: "image/jpeg" }));
    }, "image/jpeg", quality);
  });
}

export function NewProductForm({ categories: initialCategories }: NewProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryError, setNewCategoryError] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [sizes, setSizes] = useState<SizeEntry[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { inventory: 0, tags: [], isCustomizable: false },
  });

  const isCustomizable = watch("isCustomizable");

  const handleAddCategory = async () => {
    const parsed = categorySchema.safeParse({ name: newCategoryName });
    if (!parsed.success) {
      setNewCategoryError(parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid name");
      return;
    }
    setNewCategoryError("");
    setIsCreatingCategory(true);
    const result = await createCategoryAction({ name: newCategoryName }) as { success?: boolean; category?: { id: string; name: string }; error?: Record<string, string[]> | string };
    setIsCreatingCategory(false);
    if (result.error) {
      const msg = typeof result.error === "string" ? result.error : (result.error as Record<string, string[]>).name?.[0] ?? "Failed to create category";
      setNewCategoryError(msg);
      return;
    }
    const newCat = result.success ? result.category : null;
    if (newCat) {
      setCategories((prev) => [...prev, { id: newCat.id, name: newCat.name }]);
      setValue("categoryId", newCat.id);
      setShowNewCategory(false);
      setNewCategoryName("");
    }
  };

  const addImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    const remaining = 6 - images.length;
    const toAdd = fileArray.slice(0, remaining);

    const newImages = await Promise.all(
      toAdd.map(async (file) => {
        const compressed = await compressImage(file);
        return {
          file: compressed,
          preview: await readFileAsDataURL(compressed),
        };
      })
    );

    setImages((prev) => [...prev, ...newImages].slice(0, 6));
  }, [images.length]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addImages(e.dataTransfer.files);
      }
    },
    [addImages]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addImages(e.target.files);
        e.target.value = "";
      }
    },
    [addImages]
  );

  const addCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      { label: "", type: "text", options: [], required: false, sortOrder: prev.length },
    ]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, sortOrder: i })));
  };

  const updateCustomField = (index: number, updates: Partial<CustomField>) => {
    setCustomFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const addSize = () => {
    setSizes((prev) => [...prev, { label: "", price: 0, sortOrder: prev.length }]);
  };

  const removeSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, sortOrder: i })));
  };

  const updateSize = (index: number, updates: Partial<SizeEntry>) => {
    setSizes((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const [uploadError, setUploadError] = useState("");

  const onSubmit = (data: ProductInput) => {
    startTransition(async () => {
      try {
        setUploadError("");
        const fd = new FormData();
        fd.append("title", data.title);
        fd.append("description", data.description);
        fd.append("price", String(data.price));
        if (data.compareAtPrice) fd.append("compareAtPrice", String(data.compareAtPrice));
        fd.append("inventory", String(data.inventory));
        fd.append("categoryId", data.categoryId);
        if (data.brand) fd.append("brand", data.brand);
        fd.append("tags", JSON.stringify(data.tags || []));
        fd.append("isCustomizable", data.isCustomizable ? "true" : "false");
        images.forEach((img, idx) => fd.append(`image-${idx}`, img.file));

        const res = await fetch("/api/products/create", {
          method: "POST",
          body: fd,
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to create product");
        }
        if (result.success) {
          if (data.isCustomizable && customFields.length > 0) {
            await saveCustomFieldsAction(result.product.id, customFields);
          }
          if (sizes.length > 0) {
            await saveProductSizesAction(result.product.id, sizes);
          }
          router.push("/seller");
        }
      } catch (e) {
        console.error("Failed to create product:", e);
        setUploadError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div>
            <Label>Product Images</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drop images here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP up to 5MB each (max 6 images)
              </p>
            </div>

            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                    <Image
                      src={img.preview}
                      alt={`Product image ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 150px"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} className="mt-1" />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={4}
              {...register("description")}
              className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y min-h-[100px]"
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.price && (
                <p className="text-sm text-destructive mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="compareAtPrice">Compare at Price</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                {...register("compareAtPrice", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inventory">Inventory</Label>
              <Input
                id="inventory"
                type="number"
                {...register("inventory", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.inventory && (
                <p className="text-sm text-destructive mt-1">
                  {errors.inventory.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <div className="flex gap-2 mt-1">
                <select
                  id="categoryId"
                  {...register("categoryId")}
                  className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  aria-label="Add new category"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.categoryId && (
                <p className="text-sm text-destructive mt-1">
                  {errors.categoryId.message}
                </p>
              )}
              {showNewCategory && (
                <div className="mt-3 flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => { setNewCategoryName(e.target.value); setNewCategoryError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                    />
                    {newCategoryError && (
                      <p className="text-sm text-destructive mt-1">{newCategoryError}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                  >
                    {isCreatingCategory ? "Adding..." : "Add"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register("brand")} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCustomizable"
              {...register("isCustomizable")}
              className="h-4 w-4 accent-primary"
            />
            <Label htmlFor="isCustomizable" className="text-sm cursor-pointer">
              This is a customizable / made-to-order product
            </Label>
          </div>

          {isCustomizable && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Customization Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                  <Plus className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>
              {customFields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No fields added yet. Customers will fill these before adding to cart.
                </p>
              )}
              {customFields.map((field, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Field {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(index)}
                      className="text-destructive h-7 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateCustomField(index, { label: e.target.value })}
                        placeholder="e.g. Name to engrave"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <select
                        value={field.type}
                        onChange={(e) => updateCustomField(index, { type: e.target.value })}
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Text Area</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </div>
                  </div>
                  {field.type === "select" && (
                    <div>
                      <Label className="text-xs">Options (one per line)</Label>
                      <textarea
                        value={field.options.join("\n")}
                        onChange={(e) => updateCustomField(index, { options: e.target.value.split("\n").filter(Boolean) })}
                        rows={3}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field.required}
                      onChange={(e) => updateCustomField(index, { required: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                    <Label htmlFor={`required-${index}`} className="text-xs cursor-pointer">
                      Required
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCustomizable && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Sizes / Variants (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSize}>
                  <Plus className="h-4 w-4 mr-1" /> Add Size
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add size variants with different prices (e.g., for frames, artwork).
              </p>
              {sizes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No sizes defined. The base price will be used.
                </p>
              )}
              {sizes.map((size, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Size {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSize(index)}
                      className="text-destructive h-7 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={size.label}
                        onChange={(e) => updateSize(index, { label: e.target.value })}
                        placeholder="e.g. 4×6 inches"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={size.price || ""}
                        onChange={(e) => updateSize(index, { price: parseFloat(e.target.value) || 0 })}
                        placeholder="299"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Creating..." : "Create Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
