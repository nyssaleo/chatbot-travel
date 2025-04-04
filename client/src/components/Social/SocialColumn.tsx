import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface SocialColumnProps {
  currentLocation: string;
}

const SocialColumn: React.FC<SocialColumnProps> = ({ currentLocation }) => {
  const [activeTab, setActiveTab] = useState("group-chat");
  const [message, setMessage] = useState("");
  
  // Mock data for group chat
  const groupChatMessages = [
    { id: 1, sender: "Emily", message: "Has anyone visited Paris in the spring?", time: "10:30 AM", avatar: "E" },
    { id: 2, sender: "Michael", message: "Yes! The weather is perfect and fewer crowds. I recommend April.", time: "10:35 AM", avatar: "M" },
    { id: 3, sender: "You", message: "I'm planning to go next month. Any specific recommendations?", time: "10:38 AM", avatar: "Y" },
    { id: 4, sender: "Sophia", message: "Don't miss the Luxembourg Gardens, they're beautiful that time of year!", time: "10:42 AM", avatar: "S" },
  ];
  
  // Mock data for shared itineraries
  const sharedItineraries = [
    { id: 1, title: "Weekend in Rome", creator: "Alex", days: 3, likes: 24, avatar: "A" },
    { id: 2, title: "Tokyo Adventure", creator: "Maria", days: 7, likes: 42, avatar: "M" },
    { id: 3, title: "Paris Highlights", creator: "James", days: 4, likes: 18, avatar: "J" },
  ];
  
  // Mock data for local guides
  const localGuides = [
    { id: 1, name: "Antoine", location: "Paris", languages: ["English", "French"], rating: 4.8, specialties: ["History", "Food"], avatar: "A" },
    { id: 2, name: "Mei", location: "Tokyo", languages: ["English", "Japanese"], rating: 4.9, specialties: ["Culture", "Photography"], avatar: "M" },
    { id: 3, name: "Carlos", location: "Barcelona", languages: ["English", "Spanish"], rating: 4.7, specialties: ["Architecture", "Nightlife"], avatar: "C" },
  ];
  
  const handleSendMessage = () => {
    if (message.trim()) {
      // Here you would normally send the message to the server
      // For now, we'll just clear the input
      setMessage("");
    }
  };
  
  return (
    <div className="h-full flex flex-col glass-column">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center">
          <i className="fas fa-users text-primary mr-2"></i>
          Social
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect with travelers & locals
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 pt-2 glass-tab-list">
          <TabsTrigger value="group-chat" className="flex items-center">
            <i className="fas fa-comments mr-1.5"></i> Chat
          </TabsTrigger>
          <TabsTrigger value="itineraries" className="flex items-center">
            <i className="fas fa-route mr-1.5"></i> Itineraries
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center">
            <i className="fas fa-user-tie mr-1.5"></i> Local Guides
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="group-chat" className="flex flex-col h-full mt-0">
            <div className="px-4 py-2">
              <Card className="glass-darker overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-globe-americas text-primary mr-2"></i>
                    {currentLocation ? `${currentLocation} Travelers` : 'Global Travelers Chat'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Connect with fellow travelers planning their trips or currently visiting {currentLocation || 'destinations worldwide'}.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex-1 px-4 pb-4 pt-2 space-y-4 overflow-y-auto">
              {groupChatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`flex ${msg.sender === 'You' ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}
                  >
                    <Avatar className="w-8 h-8 mt-0.5">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {msg.avatar}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div 
                      className={`mx-2 ${
                        msg.sender === 'You' 
                          ? 'bg-primary/20 text-primary-foreground' 
                          : 'glass-lighter'
                      } px-3 py-2 rounded-lg`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${msg.sender === 'You' ? 'text-primary' : 'text-foreground'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {msg.time}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t mt-auto">
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Type your message..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 glass-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  size="icon" 
                  className="glass-btn"
                  onClick={handleSendMessage}
                >
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="itineraries" className="mt-0 px-4 py-2 space-y-4">
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-route text-primary mr-2"></i>
                    Shared Itineraries
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 gap-1">
                    <i className="fas fa-plus text-xs"></i>
                    <span className="text-xs">Share Yours</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sharedItineraries.map((itinerary, index) => (
                  <div key={itinerary.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <Avatar className="w-8 h-8 mt-0.5">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {itinerary.avatar}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="ml-2">
                          <h4 className="text-sm font-medium">{itinerary.title}</h4>
                          <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                            <span>By {itinerary.creator}</span>
                            <span className="mx-1.5">•</span>
                            <span>{itinerary.days} days</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <i className="far fa-heart text-muted-foreground text-xs"></i>
                        </Button>
                        <span className="text-xs text-muted-foreground">{itinerary.likes}</span>
                      </div>
                    </div>
                    
                    {index < sharedItineraries.length - 1 && <Separator className="my-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-fire text-primary mr-2"></i>
                  Trending Destinations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary">
                    <i className="fas fa-hashtag text-xs mr-1"></i> Paris
                  </Badge>
                  <Badge className="bg-primary/10 text-primary">
                    <i className="fas fa-hashtag text-xs mr-1"></i> Tokyo
                  </Badge>
                  <Badge className="bg-primary/10 text-primary">
                    <i className="fas fa-hashtag text-xs mr-1"></i> Bali
                  </Badge>
                  <Badge className="bg-primary/10 text-primary">
                    <i className="fas fa-hashtag text-xs mr-1"></i> New York
                  </Badge>
                  <Badge className="bg-primary/10 text-primary">
                    <i className="fas fa-hashtag text-xs mr-1"></i> Iceland
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="guides" className="mt-0 px-4 py-2 space-y-4">
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-user-tie text-primary mr-2"></i>
                    Local Guides
                  </CardTitle>
                  
                  {currentLocation && (
                    <Badge className="bg-primary/10 text-primary">
                      Showing for: {currentLocation}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {localGuides
                  .filter(guide => !currentLocation || guide.location === currentLocation)
                  .map((guide, index, filteredGuides) => (
                    <div key={guide.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <Avatar className="w-10 h-10 mt-0.5">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {guide.avatar}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="ml-2">
                            <h4 className="text-sm font-medium">{guide.name}</h4>
                            <div className="flex items-center text-xs mt-0.5">
                              <i className="fas fa-star text-yellow-400 mr-1"></i>
                              <span>{guide.rating}</span>
                              <span className="mx-1.5">•</span>
                              <span className="text-muted-foreground">{guide.location}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-1">
                              {guide.specialties.map(specialty => (
                                <Badge 
                                  key={specialty} 
                                  variant="outline" 
                                  className="bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0"
                                >
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <Button size="sm" variant="ghost" className="h-8">
                          <i className="fas fa-comment-dots mr-1.5"></i>
                          <span className="text-xs">Chat</span>
                        </Button>
                      </div>
                      
                      {index < filteredGuides.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))}
                
                {(!currentLocation || !localGuides.some(guide => guide.location === currentLocation)) && (
                  <div className="text-center py-4 text-muted-foreground">
                    <i className="fas fa-user-tie text-4xl mb-2 opacity-20"></i>
                    <p>No guides available for this location yet.</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <i className="fas fa-search mr-1.5"></i>
                      <span className="text-xs">Browse all guides</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default SocialColumn;