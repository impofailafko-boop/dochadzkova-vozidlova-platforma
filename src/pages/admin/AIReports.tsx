import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Loader2, Trash2, Copy, Check } from 'lucide-react';
import { useAIReports } from '@/hooks/useAIReports';
import { toast } from 'sonner';

const suggestedPrompts = [
  'Zhrň dochádzku za tento mesiac',
  'Ktoré vozidlo najviac tankovalo?',
  'Top 3 zamestnanci podľa odpracovaných hodín',
  'Aké projekty mali najvyššie náklady na palivá?',
  'Koľko km spolu najazdili všetky vozidlá?',
  'Aký je priemer odpracovaných hodín na zamestnanca?',
];

const AIReports = () => {
  const { messages, isLoading, askAI, clearChat } = useAIReports();
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    askAI(input);
    setInput('');
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success('Skopírované do schránky');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Nepodarilo sa skopírovať');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Asistent pre Reporty
        </h1>
        <p className="text-muted-foreground">
          Opýtajte sa na čokoľvek o firemných dátach - dochádzke, jazdách, tankovaní a projektoch
        </p>
      </div>

      {messages.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rýchle otázky</CardTitle>
            <CardDescription>
              Kliknite na niektorú z navrhovaných otázok alebo napíšte vlastnú
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => handlePromptClick(prompt)}
                >
                  <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{prompt}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {messages.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Konverzácia</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Vymazať
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant={message.role === 'user' ? 'secondary' : 'default'}>
                          {message.role === 'user' ? 'Vy' : 'AI'}
                        </Badge>
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-auto"
                            onClick={() => copyToClipboard(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Napíšte svoju otázku..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isLoading ? 'Spracovávam...' : 'Opýtať sa AI'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIReports;
