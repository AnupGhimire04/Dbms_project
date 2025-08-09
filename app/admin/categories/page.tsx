"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Edit, MoreHorizontal, Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { categoryApi, type Category, type CategoryInput } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function AdminCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<(Category & { imageFile?: File }) | null>(null)
  const [newCategory, setNewCategory] = useState<Partial<CategoryInput> & { imageFile?: File }>({
    name: "",
    description: "",
    imageFile: undefined,
  })

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch all categories from the API
  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const { categories } = await categoryApi.getAllCategories()

      setCategories(categories)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new category
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Validation Error",
        description: "Please provide a category name",
        variant: "destructive",
      })
      return
    }

    try {
      // Step 1: Create the category without the image
      const categoryToAdd: CategoryInput = {
        name: newCategory.name,
        description: newCategory.description,
      }

      const { category } = await categoryApi.createCategory(categoryToAdd)

      // Step 2: If there's an image file, upload it
      if (newCategory.imageFile) {
        try {
          await categoryApi.uploadCategoryImage(category._id, newCategory.imageFile)
          toast({
            title: "Success",
            description: "Category and image added successfully",
          })
        } catch (error) {
          console.error("Failed to upload image:", error)
          toast({
            title: "Warning",
            description: "Category created but image upload failed",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Success",
          description: "Category added successfully",
        })
      }

      // Refresh categories
      fetchCategories()

      // Reset form and close dialog
      setNewCategory({
        name: "",
        description: "",
        imageFile: undefined,
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Failed to add category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add category",
        variant: "destructive",
      })
    }
  }

  // Edit an existing category
  const handleEditCategory = async () => {
    if (!currentCategory) return

    try {
      // Step 1: Update the category details
      const categoryToUpdate: Partial<CategoryInput> = {
        name: currentCategory.name,
        description: currentCategory.description,
      }

      await categoryApi.updateCategory(currentCategory._id, categoryToUpdate)

      // Step 2: If there's a new image file, upload it
      if (currentCategory.imageFile) {
        try {
          await categoryApi.uploadCategoryImage(currentCategory._id, currentCategory.imageFile)
          toast({
            title: "Success",
            description: "Category and image updated successfully",
          })
        } catch (error) {
          console.error("Failed to upload image:", error)
          toast({
            title: "Warning",
            description: "Category updated but image upload failed",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Success",
          description: "Category updated successfully",
        })
      }

      // Refresh categories
      fetchCategories()

      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Failed to update category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      })
    }
  }

  // Delete a category
  const handleDeleteCategory = async () => {
    if (!currentCategory) return

    try {
      await categoryApi.deleteCategory(currentCategory._id)

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })

      // Refresh categories
      fetchCategories()

      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (category: Category) => {
    setCurrentCategory(category)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setCurrentCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10000000) {
        toast({
          title: "File Too Large",
          description: "Image must be less than 10MB",
          variant: "destructive",
        })
        return
      }

      setNewCategory({ ...newCategory, imageFile: file })

      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewCategory((prev) => ({ ...prev, thumbnail_url: event.target?.result as string }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentCategory) return

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10000000) {
        toast({
          title: "File Too Large",
          description: "Image must be less than 10MB",
          variant: "destructive",
        })
        return
      }

      setCurrentCategory({ ...currentCategory, imageFile: file })

      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result && currentCategory) {
          setCurrentCategory((prev) => (prev ? { ...prev, thumbnail_url: event.target?.result as string } : null))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
          <p className="text-muted-foreground">Add, edit, or remove menu categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>Add a new menu category. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newCategory.description || ""}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Thumbnail Image (Optional)</Label>
                <div className="flex flex-col gap-2">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageFileChange} />
                  {newCategory.thumbnail_url && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                      <Image
                        src={newCategory.thumbnail_url || "/placeholder.svg"}
                        alt="Preview"
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <div className="col-span-full text-center p-8 border rounded-md">
              <p className="text-muted-foreground">No categories found</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </div>
          ) : (
            categories.map((category, index) => (
              <Card key={category._id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription className="mt-1">{category.description}</CardDescription>
                      )}
                    </div>
                    {category.thumbnail_url && (
                      <Image
                        src={category.thumbnail_url || "/placeholder.svg?height=100&width=100"}
                        alt={category.name}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent></CardContent>
                <CardFooter className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(category)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(category)}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Make changes to the category. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {currentCategory && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={currentCategory.description || ""}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-image">Thumbnail Image (Optional)</Label>
                <div className="flex flex-col gap-2">
                  <Input id="edit-image" type="file" accept="image/*" onChange={handleEditImageFileChange} />
                  {currentCategory.thumbnail_url && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Current image:</p>
                      <Image
                        src={currentCategory.thumbnail_url || "/placeholder.svg"}
                        alt={currentCategory.name}
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentCategory && (
            <div className="py-4">
              <p>
                <strong>Category:</strong> {currentCategory.name}
              </p>
              {currentCategory.description && (
                <p>
                  <strong>Description:</strong> {currentCategory.description}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}