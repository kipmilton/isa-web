import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload, 
  Link as LinkIcon,
  Save,
  X,
  GripVertical,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TrendingPostsService, TrendingPost, CreateTrendingPostData, UpdateTrendingPostData } from "@/services/trendingPostsService";
import { supabase } from "@/integrations/supabase/client";

const AdminTrendingPosts = () => {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TrendingPost | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState<CreateTrendingPostData>({
    title: '',
    description: '',
    image_url: '',
    image_file_path: '',
    link_url: '',
    button_text: 'Learn More',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await TrendingPostsService.getAllPosts();
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load trending posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!formData.title || !formData.description || !formData.link_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await TrendingPostsService.createPost(formData);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Trending post created successfully"
      });

      setShowCreateDialog(false);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create trending post",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost || !formData.title || !formData.description || !formData.link_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await TrendingPostsService.updatePost(selectedPost.id, formData);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Trending post updated successfully"
      });

      setShowEditDialog(false);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update trending post",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    setSaving(true);
    try {
      const { error } = await TrendingPostsService.deletePost(selectedPost.id);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Trending post deleted successfully"
      });

      setShowDeleteDialog(false);
      setSelectedPost(null);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete trending post",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (post: TrendingPost) => {
    try {
      const { error } = await TrendingPostsService.togglePostStatus(post.id, !post.is_active);
      if (error) throw error;

      toast({
        title: "Success",
        description: `Post ${post.is_active ? 'deactivated' : 'activated'} successfully`
      });

      loadPosts();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `myplug-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('myplug-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('myplug-uploads')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_file_path: `/${filePath}`,
        image_url: publicUrl
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setImageUploading(false);
    }
  };

  const openEditDialog = (post: TrendingPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      description: post.description,
      image_url: post.image_url || '',
      image_file_path: post.image_file_path || '',
      link_url: post.link_url,
      button_text: post.button_text,
      is_active: post.is_active,
      sort_order: post.sort_order
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (post: TrendingPost) => {
    setSelectedPost(post);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      image_file_path: '',
      link_url: '',
      button_text: 'Learn More',
      is_active: true,
      sort_order: 0
    });
    setSelectedPost(null);
  };

  const getImageUrl = (post: TrendingPost) => {
    return post.image_url || post.image_file_path || '/placeholder.svg';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading trending posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trending Posts</h1>
          <p className="text-gray-600 mt-2">Manage the trending posts displayed on the homepage</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Post
        </Button>
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-48 h-32 flex-shrink-0">
                  <img
                    src={getImageUrl(post)}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
                        <Badge variant={post.is_active ? "default" : "secondary"}>
                          {post.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Order: {post.sort_order}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Link: {post.link_url}</span>
                        <span>Button: {post.button_text}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(post)}
                        title={post.is_active ? "Deactivate" : "Activate"}
                      >
                        {post.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(post)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(post)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Trending Post</DialogTitle>
            <DialogDescription>
              Add a new trending post to be displayed on the homepage
            </DialogDescription>
          </DialogHeader>
          <PostForm
            formData={formData}
            setFormData={setFormData}
            onImageUpload={handleImageUpload}
            imageUploading={imageUploading}
            onSubmit={handleCreatePost}
            onCancel={() => {
              setShowCreateDialog(false);
              resetForm();
            }}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Trending Post</DialogTitle>
            <DialogDescription>
              Update the trending post details
            </DialogDescription>
          </DialogHeader>
          <PostForm
            formData={formData}
            setFormData={setFormData}
            onImageUpload={handleImageUpload}
            imageUploading={imageUploading}
            onSubmit={handleUpdatePost}
            onCancel={() => {
              setShowEditDialog(false);
              resetForm();
            }}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trending Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePost} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PostFormProps {
  formData: CreateTrendingPostData;
  setFormData: (data: CreateTrendingPostData) => void;
  onImageUpload: (file: File) => void;
  imageUploading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
}

const PostForm = ({ formData, setFormData, onImageUpload, imageUploading, onSubmit, onCancel, saving }: PostFormProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter post title"
          />
        </div>
        <div>
          <Label htmlFor="button_text">Button Text</Label>
          <Input
            id="button_text"
            value={formData.button_text}
            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
            placeholder="Learn More"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter post description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="link_url">Link URL *</Label>
        <Input
          id="link_url"
          value={formData.link_url}
          onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
          placeholder="/chat or https://example.com"
        />
      </div>

      <div>
        <Label>Image</Label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="Image URL or upload file"
            />
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="image-upload"
            />
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Button variant="outline" type="button" disabled={imageUploading}>
                {imageUploading ? "Uploading..." : <Upload className="h-4 w-4" />}
              </Button>
            </Label>
          </div>
        </div>
        {formData.image_file_path && (
          <div className="mt-2">
            <img
              src={formData.image_file_path}
              alt="Preview"
              className="w-32 h-20 object-cover rounded border"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default AdminTrendingPosts;
