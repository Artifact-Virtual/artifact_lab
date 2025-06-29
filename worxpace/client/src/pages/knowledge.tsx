import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Globe, FileText, Database, ExternalLink, Search, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Knowledge() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newSource, setNewSource] = useState({
    name: "",
    type: "document",
    url: "",
    description: "",
    metadata: {}
  });

  const queryClient = useQueryClient();

  const { data: knowledgeSources, isLoading } = useQuery({
    queryKey: ['/api/knowledge-sources'],
    refetchInterval: 30000
  });

  const addSourceMutation = useMutation({
    mutationFn: async (source: any) => {
      return apiRequest('POST', '/api/knowledge-sources', source);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-sources'] });
      setNewSource({ name: "", type: "document", url: "", description: "", metadata: {} });
    }
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/knowledge-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-sources'] });
    }
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest('POST', '/api/knowledge/search', { query });
    }
  });

  const filteredSources = knowledgeSources?.filter((source: any) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'web': return <Globe className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-glow-green';
      case 'processing': return 'bg-glow-yellow';
      case 'error': return 'bg-glow-coral';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight">Knowledge Base</h1>
          <p className="text-gray-400 text-sm">Manage your AI knowledge sources and vector databases</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="holographic-border bg-glow-cyan/20 hover:bg-glow-cyan/30">
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-lg font-light">Add Knowledge Source</DialogTitle>
              <DialogDescription>
                Connect a new data source to enhance AI capabilities
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Source Name</label>
                <Input
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="My Knowledge Source"
                  className="bg-transparent border-white/20"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Source Type</label>
                <Select value={newSource.type} onValueChange={(value) => setNewSource({ ...newSource, type: value })}>
                  <SelectTrigger className="bg-transparent border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/20">
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="web">Web Content</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="api">API Endpoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">URL/Path</label>
                <Input
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="https://example.com or /path/to/file"
                  className="bg-transparent border-white/20"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <Textarea
                  value={newSource.description}
                  onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                  placeholder="Describe what this source contains..."
                  className="bg-transparent border-white/20"
                />
              </div>
              
              <Button 
                onClick={() => addSourceMutation.mutate(newSource)}
                disabled={addSourceMutation.isPending || !newSource.name}
                className="w-full holographic-border bg-glow-cyan/20 hover:bg-glow-cyan/30"
              >
                {addSourceMutation.isPending ? 'Adding...' : 'Add Source'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search knowledge sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-transparent border-white/20"
          />
        </div>
        <Button 
          onClick={() => searchMutation.mutate(searchQuery)}
          disabled={!searchQuery || searchMutation.isPending}
          className="holographic-border bg-glow-purple/20 hover:bg-glow-purple/30"
        >
          {searchMutation.isPending ? 'Searching...' : 'Vector Search'}
        </Button>
      </div>

      {/* Search Results */}
      {searchMutation.data && (
        <Card className="holographic-border bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg font-light">Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchMutation.data.results?.map((result: any, index: number) => (
                <div key={index} className="p-3 rounded border border-white/10 hover:border-glow-cyan/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-light">{result.title || `Result ${index + 1}`}</h4>
                      <p className="text-sm text-gray-400 mt-1">{result.content}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Score: {(result.similarity * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSources.map((source: any) => (
          <Card key={source.id} className="holographic-border bg-transparent hover:border-glow-cyan/50 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(source.type)}
                  <CardTitle className="text-sm font-light">{source.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(source.status)}`}></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSourceMutation.mutate(source.id)}
                    className="text-glow-coral hover:bg-glow-coral/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">
                {source.description || 'No description provided'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {source.type}
                  </Badge>
                </div>
                
                {source.url && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Source:</span>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-glow-cyan hover:underline flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Link
                    </a>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className={`capitalize ${
                    source.status === 'active' ? 'text-glow-green' :
                    source.status === 'processing' ? 'text-glow-yellow' :
                    'text-glow-coral'
                  }`}>
                    {source.status}
                  </span>
                </div>
                
                {source.lastIndexed && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Last Indexed:</span>
                    <span className="text-gray-300">
                      {new Date(source.lastIndexed).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSources.length === 0 && !isLoading && (
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-light mb-2">No Knowledge Sources</h3>
            <p className="text-gray-400 text-center mb-4">
              Add your first knowledge source to enhance AI capabilities with domain-specific information
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}