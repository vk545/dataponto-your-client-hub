import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Image,
  File,
  Folder,
  Upload,
  X,
  Download,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface SharedFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  folder: string;
  tags: string[];
  project_id: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

const fileTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  image: Image,
  default: File,
};

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.startsWith("image/")) return Image;
  if (fileType.includes("pdf")) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Arquivos() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolder, setNewFolder] = useState("Geral");
  const [newTags, setNewTags] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fetchFiles = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("shared_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar arquivos");
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase.from("projects").select("id, name");
    setProjects(data || []);
  };

  useEffect(() => {
    fetchFiles();
    fetchProjects();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setPendingFile(file);
    setUploadDialogOpen(true);
  };

  const uploadFile = async () => {
    if (!user || !pendingFile) return;

    setUploading(true);

    const fileExt = pendingFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("shared-files")
      .upload(fileName, pendingFile);

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("shared-files")
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase.from("shared_files").insert({
      user_id: user.id,
      file_name: pendingFile.name,
      file_url: publicUrl,
      file_type: pendingFile.type,
      file_size: pendingFile.size,
      folder: newFolder || "Geral",
      tags: newTags ? newTags.split(",").map((t) => t.trim()) : [],
      project_id: selectedProject && selectedProject !== "none" ? selectedProject : null,
    });

    if (dbError) {
      toast.error("Erro ao salvar arquivo");
    } else {
      toast.success("Arquivo enviado com sucesso!");
      fetchFiles();
    }

    setUploading(false);
    setUploadDialogOpen(false);
    setPendingFile(null);
    setNewFolder("Geral");
    setNewTags("");
    setSelectedProject("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteFile = async () => {
    if (!selectedFile) return;

    // Extract file path from URL
    const urlParts = selectedFile.file_url.split("/shared-files/");
    if (urlParts.length > 1) {
      await supabase.storage.from("shared-files").remove([urlParts[1]]);
    }

    const { error } = await supabase
      .from("shared_files")
      .delete()
      .eq("id", selectedFile.id);

    if (error) {
      toast.error("Erro ao excluir arquivo");
    } else {
      setFiles(files.filter((f) => f.id !== selectedFile.id));
      toast.success("Arquivo excluído");
    }
    setDeleteDialogOpen(false);
    setSelectedFile(null);
  };

  const uniqueFolders = [...new Set(files.map((f) => f.folder))];

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = folderFilter === "all" || file.folder === folderFilter;
    return matchesSearch && matchesFolder;
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Arquivos
            </h1>
            <p className="text-muted-foreground">Gerencie seus documentos e imagens</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Enviar Arquivo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as pastas</SelectItem>
              {uniqueFolders.map((folder) => (
                <SelectItem key={folder} value={folder}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Enviar primeiro arquivo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles.map((file) => {
              const FileIcon = getFileIcon(file.file_type);
              const isImage = file.file_type?.startsWith("image/");

              return (
                <Card
                  key={file.id}
                  className="group cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-3">
                    {/* Preview */}
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-3 overflow-hidden relative">
                      {isImage ? (
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                      
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(file.file_url, "_blank");
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* File info */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{file.folder}</span>
                        <span>{formatFileSize(file.file_size)}</span>
                      </div>
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Upload</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {pendingFile && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <File className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(pendingFile.size)}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Pasta</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    placeholder="Nome da pasta"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="ex: importante, trabalho, projeto"
                />
              </div>

              <div className="space-y-2">
                <Label>Associar a projeto</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setPendingFile(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={uploadFile} disabled={uploading}>
                  {uploading ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Excluir Arquivo"
          description={`Tem certeza que deseja excluir "${selectedFile?.file_name}"? Esta ação não pode ser desfeita.`}
          onConfirm={deleteFile}
        />
      </div>
    </AppLayout>
  );
}
