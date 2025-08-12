import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Upload,
  Eye,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface TrainingModule {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  content?: string;
  module_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminTraining = () => {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .order('module_order', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch training modules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `training-${Date.now()}.${fileExt}`;
    const filePath = `training-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSaveModule = async () => {
    try {
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const moduleData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        image_url: imageUrl,
        module_order: editingModule?.module_order || modules.length + 1,
        is_active: true
      };

      if (editingModule) {
        const { error } = await supabase
          .from('training_modules')
          .update(moduleData)
          .eq('id', editingModule.id);

        if (error) throw error;
        toast({ title: "Success", description: "Module updated successfully" });
      } else {
        const { error } = await supabase
          .from('training_modules')
          .insert(moduleData);

        if (error) throw error;
        toast({ title: "Success", description: "Module created successfully" });
      }

      setShowAddModule(false);
      setEditingModule(null);
      setFormData({ title: '', description: '', content: '', image_url: '' });
      setImageFile(null);
      fetchModules();
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: "Error",
        description: "Failed to save module",
        variant: "destructive"
      });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('training_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      toast({ title: "Success", description: "Module deleted successfully" });
      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (moduleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('training_modules')
        .update({ is_active: !isActive })
        .eq('id', moduleId);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: `Module ${!isActive ? 'activated' : 'deactivated'} successfully` 
      });
      fetchModules();
    } catch (error) {
      console.error('Error toggling module status:', error);
      toast({
        title: "Error",
        description: "Failed to update module status",
        variant: "destructive"
      });
    }
  };

  const handleReorderModule = async (moduleId: string, direction: 'up' | 'down') => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const newOrder = direction === 'up' ? module.module_order - 1 : module.module_order + 1;
    const swapModule = modules.find(m => m.module_order === newOrder);

    if (!swapModule) return;

    try {
      // Update both modules
      await supabase
        .from('training_modules')
        .update({ module_order: newOrder })
        .eq('id', moduleId);

      await supabase
        .from('training_modules')
        .update({ module_order: module.module_order })
        .eq('id', swapModule.id);

      toast({ title: "Success", description: "Module order updated" });
      fetchModules();
    } catch (error) {
      console.error('Error reordering module:', error);
      toast({
        title: "Error",
        description: "Failed to reorder module",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (module: TrainingModule) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      content: module.content || '',
      image_url: module.image_url || ''
    });
    setShowAddModule(true);
  };

  const openAddDialog = () => {
    setEditingModule(null);
    setFormData({ title: '', description: '', content: '', image_url: '' });
    setImageFile(null);
    setShowAddModule(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Training Modules</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{module.module_order}</span>
                      <div className="flex flex-col">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReorderModule(module.id, 'up')}
                          disabled={module.module_order === 1}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReorderModule(module.id, 'down')}
                          disabled={module.module_order === modules.length}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{module.title}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {module.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={module.is_active ? "default" : "secondary"}>
                      {module.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(module)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={module.is_active ? "secondary" : "default"}
                        onClick={() => handleToggleActive(module.id, module.is_active)}
                      >
                        {module.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteModule(module.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Module Dialog */}
      <Dialog open={showAddModule} onOpenChange={setShowAddModule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Edit Training Module' : 'Add Training Module'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Module title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the module"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="image">Module Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {formData.image_url && (
                <div className="mt-2">
                  <img 
                    src={formData.image_url} 
                    alt="Current image"
                    className="w-32 h-20 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Detailed content for the module (supports basic HTML)"
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddModule(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveModule}>
                {editingModule ? 'Update' : 'Create'} Module
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTraining;