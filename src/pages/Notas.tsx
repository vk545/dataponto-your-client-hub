import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Trash2, Tag, Save, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Note {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function Notas() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar notas");
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  // Auto-save with debounce
  const saveNote = useCallback(async (note: Note) => {
    if (!user) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from("notes")
      .update({
        title: note.title,
        content: note.content,
        tags: note.tags,
      })
      .eq("id", note.id);

    if (error) {
      toast.error("Erro ao salvar nota");
    }
    setIsSaving(false);
  }, [user]);

  useEffect(() => {
    if (!selectedNote) return;
    const timer = setTimeout(() => {
      saveNote(selectedNote);
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedNote, saveNote]);

  const createNote = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: "Nova nota",
        content: "",
        tags: [],
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar nota");
    } else if (data) {
      setNotes([data, ...notes]);
      setSelectedNote(data);
      toast.success("Nota criada");
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir nota");
    } else {
      setNotes(notes.filter((n) => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
      toast.success("Nota excluída");
    }
  };

  const addTag = () => {
    if (!selectedNote || !newTag.trim()) return;
    if (selectedNote.tags.includes(newTag.trim())) {
      toast.error("Tag já existe");
      return;
    }
    const updated = { ...selectedNote, tags: [...selectedNote.tags, newTag.trim()] };
    setSelectedNote(updated);
    setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    if (!selectedNote) return;
    const updated = { ...selectedNote, tags: selectedNote.tags.filter((t) => t !== tag) };
    setSelectedNote(updated);
    setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Ideias & Notas
            </h1>
            <p className="text-muted-foreground">Bloco de notas com salvamento automático</p>
          </div>
          <Button onClick={createNote} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Nota
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading ? (
                <p className="text-muted-foreground text-center py-4">Carregando...</p>
              ) : filteredNotes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma nota encontrada</p>
              ) : (
                filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedNote?.id === note.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {note.title || "Sem título"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {note.content || "Nota vazia..."}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          {note.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{note.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.updated_at), "dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Note Editor */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={selectedNote.title || ""}
                      onChange={(e) => {
                        const updated = { ...selectedNote, title: e.target.value };
                        setSelectedNote(updated);
                        setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
                      }}
                      placeholder="Título da nota..."
                      className="text-xl font-semibold border-none p-0 h-auto focus-visible:ring-0"
                    />
                    <div className="flex items-center gap-2">
                      {isSaving && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Save className="h-3 w-3" /> Salvando...
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNote(selectedNote.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={selectedNote.content}
                    onChange={(e) => {
                      const updated = { ...selectedNote, content: e.target.value };
                      setSelectedNote(updated);
                      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
                    }}
                    placeholder="Escreva sua nota aqui..."
                    className="min-h-[300px] resize-none"
                  />

                  {/* Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                      <div className="flex gap-1">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTag()}
                          placeholder="Nova tag..."
                          className="h-7 w-24 text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={addTag} className="h-7">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Última atualização:{" "}
                    {format(new Date(selectedNote.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center text-muted-foreground">
                  <p>Selecione uma nota ou crie uma nova</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
