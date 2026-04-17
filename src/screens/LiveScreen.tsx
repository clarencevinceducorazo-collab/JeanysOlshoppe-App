import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, 
  Linking, SafeAreaView, Dimensions, Alert 
} from 'react-native';

const { width } = Dimensions.get('window');

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=100064110249756';

const schedule = [
  { day: 'Monday',    short: 'Mon', hours: '11:00 AM – 5:00 PM', active: true },
  { day: 'Tuesday',   short: 'Tue', hours: '11:00 AM – 5:00 PM', active: true },
  { day: 'Wednesday', short: 'Wed', hours: 'Rest Day',            active: false },
  { day: 'Thursday',  short: 'Thu', hours: '11:00 AM – 5:00 PM', active: true },
  { day: 'Friday',    short: 'Fri', hours: '11:00 AM – 5:00 PM', active: true },
  { day: 'Saturday',  short: 'Sat', hours: 'Rest Day',            active: false },
  { day: 'Sunday',    short: 'Sun', hours: 'Rest Day',            active: false },
];

const TODAY_INDEX = new Date().getDay(); // 0=Sun, 1=Mon...
const DAY_MAP: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};
const TODAY_NAME = DAY_MAP[TODAY_INDEX];

export function LiveScreen() {
  
  const handleWatchLive = async () => {
    try {
      const supported = await Linking.canOpenURL(FACEBOOK_URL);
      if (supported) {
        await Linking.openURL(FACEBOOK_URL);
      } else {
        Alert.alert('Facebook Error', 'Unable to open Facebook link.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── HERO SECTION ── */}
        <ImageBackground 
          source={{ uri: 'https://picsum.photos/seed/japansurplus/1920/1080' }} 
          style={styles.heroSection}
          resizeMode="cover"
        >
          {/* Gradients via absolute views */}
          <View style={styles.heroOverlayDark} />
          
          <View style={styles.liveBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>

          <View style={styles.heroContent}>
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={handleWatchLive}
              activeOpacity={0.8}
            >
              <Text style={styles.playIcon}>▶</Text>
            </TouchableOpacity>

            <Text style={styles.heroTitle}>Watch Live Selling</Text>
            <Text style={styles.heroDescription}>
              Japan Surplus finds — live every day on Facebook. Shop in real-time!
            </Text>

            <View style={styles.timeChip}>
              <Text style={styles.timeIcon}>⏱</Text>
              <Text style={styles.timeChipText}>11:00 AM – 5:00 PM daily</Text>
            </View>
          </View>
        </ImageBackground>

        {/* ── STICKY WATCH LIVE CTA (Native translation block) ── */}
        <View style={styles.stickyCtaContainer}>
          <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={handleWatchLive}
            activeOpacity={0.9}
          >
            <View style={styles.pulseDot} />
            <Text style={styles.ctaButtonText}>WATCH LIVE NOW ON FACEBOOK</Text>
            <Text style={styles.ctaButtonIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* ── SCHEDULE SECTION ── */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHeader}>
            <View style={styles.calendarIconContainer}>
               <Text style={styles.calendarIcon}>📅</Text>
            </View>
            <View>
              <Text style={styles.scheduleTitle}>Weekly Broadcast Schedule</Text>
              <Text style={styles.scheduleSubtitle}>📍 Mapandan, Pangasinan, Philippines</Text>
            </View>
          </View>

          <View style={styles.scheduleCards}>
            {schedule.map((slot) => {
              const isToday = slot.day === TODAY_NAME;
              
              return (
                <View 
                  key={slot.day} 
                  style={[
                    styles.scheduleCard,
                    slot.active ? (isToday ? styles.cardActiveToday : styles.cardActive) : styles.cardInactive
                  ]}
                >
                  <View style={styles.dayCol}>
                    <Text style={[
                      styles.dayText,
                      isToday ? styles.textAccent : (slot.active ? styles.textPrimary : styles.textMuted)
                    ]}>
                      {slot.day}
                    </Text>
                    {isToday && <Text style={styles.todayText}>TODAY</Text>}
                  </View>

                  <View style={styles.hoursCol}>
                    {slot.active ? (
                      <Text style={[styles.hoursText, isToday ? styles.textAccent : styles.textPrimary]}>
                        {slot.hours}
                      </Text>
                    ) : (
                      <Text style={styles.restText}>Rest Day</Text>
                    )}
                  </View>

                  <View style={styles.statusCol}>
                    {slot.active ? (
                      <View style={[styles.statusDot, isToday ? styles.dotGreen : styles.dotGreenFaded]} />
                    ) : (
                      <View style={styles.dotGray} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.noteText}>
            Live sessions run Mon, Tue, Thu & Fri · Times are Philippine Standard Time (PHT)
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Wabi-Sabi light base
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // -- Hero --
  heroSection: {
    width: width,
    height: 420,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  heroOverlayDark: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  liveBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 10,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dc2626',
    borderWidth: 4,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  playIcon: {
    color: '#ffffff',
    fontSize: 24,
    marginLeft: 4, // center optical alignment for play triangles
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  timeIcon: {
    color: '#f87171',
    marginRight: 8,
  },
  timeChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // -- CTA --
  stickyCtaContainer: {
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  ctaButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  ctaButtonIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // -- Schedule --
  scheduleSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  calendarIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 113, 133, 0.1)', // Accent/10
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    fontSize: 20,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  scheduleSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  scheduleCards: {
    gap: 10,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardActiveToday: {
    backgroundColor: 'rgba(251, 113, 133, 0.05)',
    borderColor: 'rgba(251, 113, 133, 0.3)',
  },
  cardActive: {
    backgroundColor: '#ffffff',
    borderColor: '#EBEAE5',
  },
  cardInactive: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderColor: 'rgba(0,0,0,0.05)',
    opacity: 0.6,
  },
  dayCol: {
    width: 80,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  todayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fb7185',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  hoursCol: {
    flex: 1,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '600',
  },
  restText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },
  statusCol: {
    alignItems: 'flex-end',
    width: 24,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: {
    backgroundColor: '#22c55e',
  },
  dotGreenFaded: {
    backgroundColor: 'rgba(34, 197, 94, 0.5)',
  },
  dotGray: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  
  textAccent: { color: '#fb7185' },
  textPrimary: { color: '#333333' },
  textMuted: { color: '#999999' },
  
  noteText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    marginTop: 24,
  },
});
