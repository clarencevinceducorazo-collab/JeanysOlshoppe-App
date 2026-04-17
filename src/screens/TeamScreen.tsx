import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, 
  SafeAreaView, Dimensions 
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  image_url: string | null;
  status: string;
  category: 'admin' | 'assistant' | 'rider' | 'host' | null;
  description: string | null;
  is_online?: boolean;  // From PRD if we merge statuses
};

export function TeamScreen() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('created_at', { ascending: true });

        if (data) setMembers(data as TeamMember[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTeam();

    const channel = supabase.channel('realtime_team')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMembers(prev => [...prev, payload.new as TeamMember]);
        } else if (payload.eventType === 'UPDATE') {
          setMembers(prev => prev.map(m => m.id === payload.new.id ? payload.new as TeamMember : m));
        } else if (payload.eventType === 'DELETE') {
          setMembers(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const activeMembers = members.filter(m => m.status === 'active');
  const host = activeMembers.find(m => m.category === 'host');
  const assistants = activeMembers.filter(m => m.category === 'assistant' || m.category === 'admin');
  const riders = activeMembers.filter(m => m.category === 'rider');

  // Reusable Member Card
  const MemberCard = ({ member }: { member: TeamMember }) => {
    const isAdmin = member.category === 'admin';
    const isRider = member.category === 'rider';

    let badgeText = 'Assistant';
    let badgeColor = '#fb7185'; // Accent
    if (isAdmin) { badgeText = 'Admin'; badgeColor = '#f43f5e'; } // Rose
    if (isRider) { badgeText = 'Rider'; badgeColor = '#f97316'; } // Orange

    return (
      <View style={styles.memberCard}>
        <View style={[styles.badgeContainer, { backgroundColor: `${badgeColor}15`, borderColor: `${badgeColor}40` }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>

        <View style={styles.avatarContainer}>
           <Image 
              source={{ uri: member.image_url || 'https://picsum.photos/seed/placeholder-avatar/200/200' }} 
              style={styles.avatarImage} 
              resizeMode="cover" 
           />
        </View>

        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{member.role || badgeText}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <View style={styles.header}>
           <Text style={styles.headerTitle}>Our Dedicated <Text style={styles.headerTitleAccent}>Team</Text></Text>
           <Text style={styles.headerSubtitle}>
             Meet the hardworking people behind Jeany's Olshoppe ensuring you get the best Japan surplus quality delivered right to you.
           </Text>
        </View>

        {/* Live Host Section */}
        {host && (
          <View style={styles.hostSection}>
             <View style={styles.hostImageContainer}>
                <Image source={{ uri: host.image_url || 'https://picsum.photos/seed/host/300/300' }} style={styles.hostImage} />
             </View>
             <View style={styles.hostInfo}>
                <View style={styles.liveBadgeWrapper}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveBadgeText}>Live Host & Founder</Text>
                </View>
                <Text style={styles.hostName}>{host.name}</Text>
                <Text style={styles.hostRole}>{host.role}</Text>
                <Text style={styles.hostDescription}>
                  {host.description || "The main speaker and seller during live selling sessions. Presents items, answers questions, and assists customers in real time. The Voice of Jeany's."}
                </Text>
             </View>
          </View>
        )}

        {/* Assistants Grid */}
        {assistants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Our Shop Assistants</Text>
            <View style={styles.grid}>
              {assistants.map(m => <MemberCard key={m.id} member={m} />)}
            </View>
          </View>
        )}

        {/* Riders Grid */}
        {riders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚚 Our Delivery Partners</Text>
            <View style={styles.grid}>
              {riders.map(m => <MemberCard key={m.id} member={m} />)}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1512', // Dark themed base matching Next.js Team page
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1512',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerTitleAccent: {
    color: '#fb7185', // Accent color
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  
  // -- Host Section --
  hostSection: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 40,
    alignItems: 'center',
  },
  hostImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(251, 113, 133, 0.2)', // Accent border
    overflow: 'hidden',
    marginBottom: 20,
  },
  hostImage: {
    width: '100%',
    height: '100%',
  },
  hostInfo: {
    alignItems: 'center',
  },
  liveBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fb7185',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#fb7185',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hostName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  hostRole: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(251, 113, 133, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  hostDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // -- Sections --
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // -- Member Card --
  memberCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2320',
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontWeight: '500',
  },
});
