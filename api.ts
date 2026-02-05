import { supabase } from './supabase';
import type {
  Profile,
  Message,
  Persona,
  Conversation,
  ConversationMessage,
  Intelligence,
  SystemLog,
  DashboardStats,
  ScamTypeDistribution,
  DailyDetection,
  ScamType,
  RiskLevel,
  ConversationStatus,
} from '@/types';

// Profile APIs
export const profileApi = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },
};

// Message APIs
export const messageApi = {
  async createMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMessages(limit = 50): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getRecentScams(limit = 10): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_scam', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Persona APIs
export const personaApi = {
  async getPersonas(): Promise<Persona[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createPersona(persona: Omit<Persona, 'id' | 'created_at'>): Promise<Persona> {
    const { data, error } = await supabase
      .from('personas')
      .insert(persona)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePersona(id: string, updates: Partial<Persona>): Promise<void> {
    const { error } = await supabase
      .from('personas')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deletePersona(id: string): Promise<void> {
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async ensureDefaultPersonas(userId: string): Promise<void> {
    const { error } = await supabase.rpc('ensure_default_personas', {
      p_user_id: userId,
    });

    if (error) throw error;
  },
};

// Conversation APIs
export const conversationApi = {
  async getConversations(limit = 50): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('conversations')
      .select('*, persona:personas(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getConversation(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, persona:personas(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createConversation(
    conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'persona'>
  ): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getActiveConversationsCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) throw error;
    return count || 0;
  },
};

// Conversation Message APIs
export const conversationMessageApi = {
  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async addMessage(
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ): Promise<ConversationMessage> {
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Intelligence APIs
export const intelligenceApi = {
  async getIntelligence(limit = 100): Promise<Intelligence[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('intelligence')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createIntelligence(
    intelligence: Omit<Intelligence, 'id' | 'created_at'>
  ): Promise<Intelligence> {
    const { data, error } = await supabase
      .from('intelligence')
      .insert(intelligence)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteIntelligence(id: string): Promise<void> {
    const { error } = await supabase
      .from('intelligence')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getIntelligenceCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('intelligence')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) throw error;
    return count || 0;
  },

  async getRecentIntelligence(limit = 5): Promise<Intelligence[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('intelligence')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },
};

// System Log APIs
export const systemLogApi = {
  async getLogs(limit = 100): Promise<SystemLog[]> {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createLog(log: Omit<SystemLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('system_logs')
      .insert(log);

    if (error) console.error('Failed to create log:', error);
  },
};

// Dashboard APIs
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalMessages: 0,
        totalScams: 0,
        activeConversations: 0,
        intelligenceExtracted: 0,
      };
    }

    const [messagesCount, scamsCount, activeConvCount, intelCount] = await Promise.all([
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_scam', true),
      supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('intelligence')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    return {
      totalMessages: messagesCount.count || 0,
      totalScams: scamsCount.count || 0,
      activeConversations: activeConvCount.count || 0,
      intelligenceExtracted: intelCount.count || 0,
    };
  },

  async getScamTypeDistribution(): Promise<ScamTypeDistribution[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('scam_type')
      .eq('user_id', user.id)
      .eq('is_scam', true)
      .not('scam_type', 'is', null);

    if (error) throw error;

    const distribution: Record<string, number> = {};
    (data || []).forEach((item) => {
      if (item.scam_type) {
        distribution[item.scam_type] = (distribution[item.scam_type] || 0) + 1;
      }
    });

    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
    }));
  },

  async getDailyDetections(days = 7): Promise<DailyDetection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('messages')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('is_scam', true)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const detectionsByDate: Record<string, number> = {};
    (data || []).forEach((item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      detectionsByDate[date] = (detectionsByDate[date] || 0) + 1;
    });

    const result: DailyDetection[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: detectionsByDate[dateStr] || 0,
      });
    }

    return result;
  },
};
