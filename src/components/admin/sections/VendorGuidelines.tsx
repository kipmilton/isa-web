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
import { Upload, Download, FileText, Trash2, Eye, EyeOff } from "lucide-react";

interface Guideline {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  is_active: boolean;
  version: string;
  created_at: string;
}

const VendorGuidelines = () => {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_guidelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuidelines(data || []);
    } catch (error) {
      console.error('Error fetching guidelines:', error);
      toast({
        title: "Error",
        description: "Failed to fetch guidelines",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Please select a PDF file",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!title || !file) {
      toast({
        title: "Error",
        description: "Please provide title and file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `vendor-guidelines/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert guideline record
      const { error: insertError } = await supabase
        .from('vendor_guidelines')
        .insert({
          title,
          description,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          version,
          uploaded_by: user?.id,
          is_active: true
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Guideline uploaded successfully"
      });

      setShowUpload(false);
      setTitle("");
      setDescription("");
      setVersion("1.0");
      setFile(null);
      fetchGuidelines();
    } catch (error: any) {
      console.error('Error uploading guideline:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload guideline",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendor_guidelines')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Guideline ${!currentStatus ? 'activated' : 'deactivated'}`
      });

      fetchGuidelines();
    } catch (error) {
      console.error('Error toggling guideline:', error);
      toast({
        title: "Error",
        description: "Failed to update guideline",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    try {
      // Delete file from storage
      const filePath = fileUrl.split('/').slice(-2).join('/');
      await supabase.storage
        .from('product-images')
        .remove([filePath]);

      // Delete record
      const { error } = await supabase
        .from('vendor_guidelines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Guideline deleted successfully"
      });

      fetchGuidelines();
    } catch (error) {
      console.error('Error deleting guideline:', error);
      toast({
        title: "Error",
        description: "Failed to delete guideline",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Guidelines</h1>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Guideline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Vendor Guideline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., MyPlug Vendor Guidelines"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the guideline"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0"
                />
              </div>
              <div>
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {file.name} ({formatFileSize(file.size)})
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Available Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guidelines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No guidelines uploaded yet
                  </TableCell>
                </TableRow>
              ) : (
                guidelines.map((guideline) => (
                  <TableRow key={guideline.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{guideline.title}</div>
                        {guideline.description && (
                          <div className="text-sm text-gray-500">{guideline.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{guideline.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{guideline.file_name}</div>
                        <div className="text-gray-500">{formatFileSize(guideline.file_size)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={guideline.is_active ? "default" : "secondary"}>
                        {guideline.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(guideline.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(guideline.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(guideline.id, guideline.is_active)}
                        >
                          {guideline.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(guideline.id, guideline.file_url)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorGuidelines;
