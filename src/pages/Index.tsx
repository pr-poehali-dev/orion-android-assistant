import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [sensitivity, setSensitivity] = useState([70]);
  const [lastCommand, setLastCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState([
    { id: 1, command: "Орион, включи музыку ВК", time: "14:32", status: "success", service: "vk" },
    { id: 2, command: "Орион, найди лучшие рестораны", time: "14:15", status: "success", service: "yandex" },
    { id: 3, command: "Орион, включи фильм Inception", time: "13:45", status: "success", service: "youtube" },
    { id: 4, command: "Орион, включи Spotify плейлист", time: "12:20", status: "success", service: "spotify" },
  ]);

  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const services = [
    { name: "ВКонтакте", icon: "Music", enabled: true, color: "neon-cyan" },
    { name: "Яндекс", icon: "Search", enabled: true, color: "neon-pink" },
    { name: "YouTube", icon: "Youtube", enabled: true, color: "neon-purple" },
    { name: "Spotify", icon: "Music2", enabled: true, color: "neon-green" },
    { name: "Google Assistant", icon: "Mic", enabled: false, color: "neon-cyan" },
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ru-RU';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');

        const lowerTranscript = transcript.toLowerCase();
        
        if (lowerTranscript.includes('орион')) {
          const command = transcript.replace(/орион/gi, '').trim();
          if (command) {
            handleCommand(transcript, command);
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast({
            title: "Ошибка распознавания",
            description: "Проверьте доступ к микрофону",
            variant: "destructive"
          });
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening || backgroundMode) {
          recognitionRef.current.start();
        }
      };
    } else {
      toast({
        title: "Браузер не поддерживается",
        description: "Используйте Chrome или Edge для голосового управления",
        variant: "destructive"
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isListening || backgroundMode) {
      startListening();
    } else {
      stopListening();
    }
  }, [isListening, backgroundMode]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        toast({
          title: "Орион активирован",
          description: backgroundMode ? "Работает в фоновом режиме" : "Слушаю команды...",
        });
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleCommand = (fullCommand: string, command: string) => {
    setLastCommand(fullCommand);
    
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let service = "system";
    let action = "";

    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('музык') || lowerCommand.includes('трек') || lowerCommand.includes('песн')) {
      if (lowerCommand.includes('вк') || lowerCommand.includes('вконтакте')) {
        service = "vk";
        action = "Запуск музыки ВКонтакте";
      } else if (lowerCommand.includes('spotify') || lowerCommand.includes('спотифай')) {
        service = "spotify";
        action = "Запуск Spotify";
      } else {
        service = "vk";
        action = "Запуск музыки";
      }
    } else if (lowerCommand.includes('найди') || lowerCommand.includes('найти') || lowerCommand.includes('поиск')) {
      if (lowerCommand.includes('яндекс')) {
        service = "yandex";
        action = `Поиск в Яндекс: ${command.replace(/яндекс|найди|найти|поиск/gi, '').trim()}`;
      } else {
        service = "yandex";
        action = `Поиск: ${command.replace(/найди|найти|поиск/gi, '').trim()}`;
      }
    } else if (lowerCommand.includes('фильм') || lowerCommand.includes('видео') || lowerCommand.includes('youtube')) {
      service = "youtube";
      action = `Поиск видео: ${command.replace(/фильм|видео|youtube|включи|включить/gi, '').trim()}`;
    } else if (lowerCommand.includes('громкость')) {
      service = "system";
      action = "Управление громкостью";
    } else if (lowerCommand.includes('яркость')) {
      service = "system";
      action = "Управление яркостью";
    } else {
      service = "system";
      action = command;
    }

    const newCommand = {
      id: Date.now(),
      command: fullCommand,
      time: timeStr,
      status: "success" as const,
      service: service
    };

    setCommandHistory(prev => [newCommand, ...prev]);

    toast({
      title: "✓ Команда выполнена",
      description: action,
      duration: 3000,
    });

    if (backgroundMode) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Орион', {
          body: action,
          icon: '/favicon.svg'
        });
      }
    }
  };

  const toggleBackgroundMode = async (enabled: boolean) => {
    setBackgroundMode(enabled);
    
    if (enabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({
            title: "Разрешите уведомления",
            description: "Для фонового режима нужны уведомления",
            variant: "destructive"
          });
          setBackgroundMode(false);
          return;
        }
      }
      
      setIsListening(true);
      toast({
        title: "Фоновый режим включен",
        description: "Орион работает даже когда приложение свернуто",
      });
    } else {
      toast({
        title: "Фоновый режим выключен",
        description: "Орион работает только в приложении",
      });
    }
  };

  const WaveVisualization = () => (
    <div className="flex items-center justify-center gap-1 h-32">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-2 bg-gradient-to-t from-neon-purple to-neon-cyan rounded-full ${
            isListening ? "animate-wave" : "h-2"
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isListening ? `${Math.random() * 80 + 20}%` : "8px",
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-pink bg-clip-text text-transparent mb-2">
            ORION
          </h1>
          <p className="text-gray-400 text-sm">Голосовой ассистент нового поколения</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-neon-purple/20">
            <TabsTrigger value="home" className="data-[state=active]:bg-neon-purple/20">
              <Icon name="Home" size={18} className="mr-2" />
              Главная
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-neon-cyan/20">
              <Icon name="History" size={18} className="mr-2" />
              История
            </TabsTrigger>
            <TabsTrigger value="control" className="data-[state=active]:bg-neon-pink/20">
              <Icon name="Sliders" size={18} className="mr-2" />
              Управление
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-neon-green/20">
              <Icon name="Settings" size={18} className="mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            {backgroundMode && (
              <Card className="bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 border-neon-cyan">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-neon-cyan rounded-full animate-pulse" />
                    <p className="text-neon-cyan font-medium">Фоновый режим активен</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-neon-purple/30 shadow-lg shadow-neon-purple/20">
              <CardContent className="pt-8 pb-8">
                <WaveVisualization />
                
                <div className="text-center mt-8 mb-6">
                  <Button
                    size="lg"
                    className={`w-64 h-64 rounded-full text-3xl font-bold transition-all duration-300 ${
                      isListening
                        ? "bg-gradient-to-br from-neon-purple to-neon-cyan animate-glow scale-110"
                        : "bg-gradient-to-br from-neon-purple/50 to-neon-cyan/50 hover:scale-105"
                    }`}
                    onClick={() => setIsListening(!isListening)}
                    disabled={backgroundMode}
                  >
                    {isListening ? (
                      <div className="flex flex-col items-center gap-3">
                        <Icon name="Mic" size={64} />
                        <span className="text-xl">Слушаю...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Icon name="MicOff" size={64} />
                        <span className="text-xl">Активация</span>
                      </div>
                    )}
                  </Button>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-gray-400 text-sm">
                    {isListening ? 'Скажите "Орион" и вашу команду' : backgroundMode ? 'Фоновый режим включен' : 'Нажмите для активации'}
                  </p>
                  {lastCommand && (
                    <p className="text-neon-purple text-sm font-medium">
                      Последняя команда: {lastCommand}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-neon-cyan/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-neon-cyan">
                    <Icon name="Music" size={20} />
                    Последний трек
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Скриптонит - Это любовь</p>
                  <p className="text-gray-500 text-sm mt-1">ВКонтакте • 3:45</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-neon-pink/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-neon-pink">
                    <Icon name="Search" size={20} />
                    Последний поиск
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Лучшие рестораны Москвы</p>
                  <p className="text-gray-500 text-sm mt-1">Яндекс • 5 минут назад</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-card border-neon-cyan/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="History" size={24} />
                  История команд
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {commandHistory.map((item) => (
                      <Card key={item.id} className="bg-card/50 border-gray-700 hover:border-neon-purple/50 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-200 font-medium">{item.command}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.time}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs border-${item.service === "vk" ? "neon-cyan" : item.service === "yandex" ? "neon-pink" : item.service === "youtube" ? "neon-purple" : "neon-green"}/50`}
                                >
                                  {item.service.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <Icon name="CheckCircle" size={20} className="text-neon-green" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="control" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-neon-purple/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Music" size={24} />
                    Музыка
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">ВКонтакте</span>
                    <Button size="sm" variant="outline" className="border-neon-cyan text-neon-cyan">
                      <Icon name="Play" size={16} className="mr-2" />
                      Играть
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Spotify</span>
                    <Button size="sm" variant="outline" className="border-neon-green text-neon-green">
                      <Icon name="Play" size={16} className="mr-2" />
                      Играть
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Локальные файлы</span>
                    <Button size="sm" variant="outline">
                      <Icon name="FolderOpen" size={16} className="mr-2" />
                      Обзор
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-neon-pink/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Search" size={24} />
                    Поиск
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Яндекс</span>
                    <Button size="sm" variant="outline" className="border-neon-pink text-neon-pink">
                      <Icon name="Search" size={16} className="mr-2" />
                      Искать
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Google</span>
                    <Button size="sm" variant="outline">
                      <Icon name="Search" size={16} className="mr-2" />
                      Искать
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-neon-purple/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Film" size={24} />
                    Видео
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">YouTube</span>
                    <Button size="sm" variant="outline" className="border-neon-purple text-neon-purple">
                      <Icon name="Play" size={16} className="mr-2" />
                      Открыть
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Локальное видео</span>
                    <Button size="sm" variant="outline">
                      <Icon name="FolderOpen" size={16} className="mr-2" />
                      Обзор
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-neon-green/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Smartphone" size={24} />
                    Система
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Громкость</span>
                    <Button size="sm" variant="outline">
                      <Icon name="Volume2" size={16} className="mr-2" />
                      Настроить
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Яркость</span>
                    <Button size="sm" variant="outline">
                      <Icon name="Sun" size={16} className="mr-2" />
                      Настроить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-card border-neon-green/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Settings" size={24} />
                  Настройки Орион
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 pb-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-gray-300 font-medium">Фоновый режим</p>
                      <p className="text-gray-500 text-xs">Орион работает даже когда приложение свернуто</p>
                    </div>
                    <Switch checked={backgroundMode} onCheckedChange={toggleBackgroundMode} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">
                    Чувствительность голоса: {sensitivity[0]}%
                  </label>
                  <Slider
                    value={sensitivity}
                    onValueChange={setSensitivity}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold">Интеграции</h3>
                  {services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon name={service.icon as any} size={20} className={`text-${service.color}`} />
                        <span className="text-gray-300">{service.name}</span>
                      </div>
                      <Switch defaultChecked={service.enabled} />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold">Дополнительно</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Звуковые эффекты</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Вибрация при ответе</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Темная тема</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
