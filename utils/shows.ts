// Centralized shows data with complete schedule
const shows = [
  // Monday, Tuesday, Thursday, Friday shows
  {
    name: 'Nuru 47',
    host: 'Eva Mwalili',
    time: '04:00 - 06:00',
    days: 'Monday, Tuesday, Thursday, Friday',
    description: 'A motivational show to inspire listeners as they start their day.',
    image: require('../assets/images/nuru.png'),
  },
  {
    name: 'Breakfast 47',
    host: 'Emmanuel Mwashumbe and Alex Mwakideu',
    time: '06:00 - 10:00',
    days: 'Monday, Tuesday, Thursday, Friday',
    description: 'A lively breakfast show combining fun with current affairs and social issues.',
    image: require('../assets/images/default.png'),
  },
  {
    name: 'Mchikicho',
    host: 'Mkamburi Chigogo and MC Japhe',
    time: '10:00 - 13:00',
    days: 'Monday, Tuesday, Thursday, Friday',
    description: 'An interactive mid-morning show blending entertainment and serious topics.',
    image: require('../assets/images/mchikicho.png'),
  },
  {
    name: 'Baze 47',
    host: 'Manucho',
    time: '13:00 - 15:00',
    days: 'Monday, Tuesday, Thursday, Friday',
    description: 'Focuses on entertainment, celebrities, and trending topics.',
    image: require('../assets/images/Baze47.png'),
  },
  {
    name: 'Maskani',
    host: 'Billy Miya & Mbaruk Mwalimu',
    time: '15:00 - 19:00',
    days: 'Monday, Tuesday, Thursday, Friday',
    description: 'A drive show with humor and insights on various issues.',
    image: require('../assets/images/Maskani.png'),
  },
  {
    name: 'Chemba',
    host: 'Dr. Ofweneke',
    time: '19:00 - 22:00',
    days: 'Monday, Tuesday, Thursday, Friday',
    description: 'Addresses relationship issues through engaging discussions.',
    image: require('../assets/images/Chemba.png'),
  },
  {
    name: 'Rhumba Fix',
    host: 'Cate Kulo',
    time: '22:00 - 01:00',
    days: 'Monday, Tuesday, Thursday, Friday',
    description: 'An interactive night show blending relaxing rhumba music and serious topics',
    image: require('../assets/images/rhumbafix.png'),
  },

  // Wednesday shows
  {
    name: 'Nuru 47',
    host: 'Eva Mwalili',
    time: '04:00 - 06:00',
    days: 'Wednesday',
    description: 'A motivational show to inspire listeners as they start their day.',
    image: require('../assets/images/nuru.png'),
  },
  {
    name: 'Breakfast 47',
    host: 'Emmanuel Mwashumbe and Alex Mwakideu',
    time: '06:00 - 10:00',
    days: 'Wednesday',
    description: 'A lively breakfast show combining fun with current affairs and social issues.',
    image: require('../assets/images/default.png'),
  },
  {
    name: 'Mchikicho',
    host: 'Mwanaisha Chidzuga',
    time: '10:00 - 13:00',
    days: 'Wednesday',
    description: 'An interactive mid-morning show blending entertainment and serious topics.',
    image: require('../assets/images/mchikicho.png'),
  },
  {
    name: 'Baze 47',
    host: 'Manucho the Young Turk',
    time: '13:00 - 15:00',
    days: 'Wednesday',
    description: 'Focuses on entertainment, celebrities, and trending topics.',
    image: require('../assets/images/Baze47.png'),
  },
  {
    name: 'Maskani',
    host: 'Billy Miya & Mbaruk Mwalimu',
    time: '15:00 - 19:00',
    days: 'Wednesday',
    description: 'A drive show with humor and insights on various issues.',
    image: require('../assets/images/Maskani.png'),
  },
  {
    name: 'Kikao Cha Hoja',
    host: 'Liz Mutuku',
    time: '19:00 - 21:00',
    days: 'Wednesday',
    description: 'A political talk show featuring policymakers and discussions on current issues.',
    image: require('../assets/images/kikaochahoja.png'),
  },
  {
    name: 'Chemba',
    host: 'Dr. Ofweneke',
    time: '21:00 - 22:00',
    days: 'Wednesday',
    description: 'Addresses relationship issues through engaging discussions.',
    image: require('../assets/images/Chemba.png'),
  },
  {
    name: 'Rhumba Fix',
    host: 'Cate Kulo',
    time: '22:00 - 01:00',
    days: 'Wednesday',
    description: 'An interactive night show blending relaxing rhumba music and serious topics',
    image: require('../assets/images/rhumbafix.png'),
  },

  // Saturday shows
  {
    name: 'Sabato Yako',
    host: 'Automated SDA Music Show',
    time: '04:00 - 06:00',
    days: 'Saturday',
    description: 'An automated SDA Music Show on Radio 47.',
    image: require('../assets/images/default.png'),
  },
  {
    name: 'Bahari Ya Elimu',
    host: 'Ali Hassan Kauleni',
    time: '07:00 - 11:00',
    days: 'Saturday',
    description: 'An interactive, educative, and entertaining show targeting students, teachers, and institutions.',
    image: require('../assets/images/Bahariyaelimu.png'),
  },
  {
    name: 'Sato Vibe',
    host: 'Mkamburi Chigogo Na Deejay Darvo',
    time: '11:00 - 14:00',
    days: 'Saturday',
    description: 'A lively program focusing on music and discussions on trending topics.',
    image: require('../assets/images/Satovibe.png'),
  },
  {
    name: 'Dread Beat Reloaded',
    host: 'Radio 47 DJ',
    time: '14:00 - 16:00',
    days: 'Saturday',
    description: 'Good energy, positive vibrations, consciousness, and positive vibes.',
    image: require('../assets/images/Dreadbeat.png'),
  },
  {
    name: 'Mikiki Ya Spoti',
    host: 'Fred Arocho, Ali Hassan Kauleni, Lucky Herriano',
    time: '16:00 - 20:00',
    days: 'Saturday',
    description: 'Crème de la crème of sports journalism with superior sports content, high energy, and humor.',
    image: require('../assets/images/default.png'),
  },
  {
    name: 'Burdan Satoo',
    host: 'Manucho',
    time: '20:00 - 00:00',
    days: 'Saturday',
    description: 'A radio show for armchair clubbers featuring the best mix of music from great DJs, hook-ups, plus great and daring conversations.',
    image: require('../assets/images/default.png'),
  },

  // Sunday shows
  {
    name: 'Radio 47 Jumapili',
    host: 'Eva Mwalili',
    time: '05:00 - 10:00',
    days: 'Sunday',
    description: 'Targets to inspire listeners as they start their Sunday.',
    image: require('../assets/images/Nuru47Jumapili.png'),
  },
  {
    name: 'Gospel Automation',
    host: 'Automated Christian Music',
    time: '10:00 - 13:00',
    days: 'Sunday',
    description: 'Automation of Christian music that has both inspired and drawn from popular music traditions.',
    image: require('../assets/images/default.png'),
  },
  {
    name: 'Dread Beat Reloaded',
    host: 'Radio 47 DJ',
    time: '13:00 - 16:00',
    days: 'Sunday',
    description: 'Good energy, positive vibrations, consciousness, and positive vibes.',
    image: require('../assets/images/default.png'),
  },
  {
    name: 'Mikiki Ya Spoti',
    host: 'Fred Arocho, Ali Hassan Kauleni, Lucky Herriano',
    time: '16:00 - 20:00',
    days: 'Sunday',
    description: 'Crème de la crème of sports journalism with superior sports content, high energy, and humor.',
    image: require('../assets/images/default.png'),
  },
  {
    name: 'Kali Za Kale',
    host: 'John Maloba',
    time: '20:00 - 22:00',
    days: 'Sunday',
    description: 'Two hours of the greatest golden oldies for some nostalgic memories.',
    image: require('../assets/images/default.png'),
  }
];

// Default "Off Studio" show for when no regular show is playing
const offStudioShow = {
  name: "Off Studio",
  host: "With our Amazing DJs",
  time: "24/7",
  days: "All Days",
  description: "Continuous music and entertainment featuring the best mix of music from our talented DJs when regular shows are off air. Stay tuned for an uninterrupted flow of great music!",
  image: require('../assets/images/default.png')
};

// Helper function to parse time string into minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to calculate show time properly
function isInTimeRange(currentTime, startMinutes, endMinutes, currentDay) {
  // Normal time range (e.g., 10:00 - 14:00)
  if (endMinutes > startMinutes) {
    return currentTime >= startMinutes && currentTime < endMinutes;
  } 
  // Time range crossing midnight (e.g., 22:00 - 02:00)
  else {
    return currentTime >= startMinutes || currentTime < endMinutes;
  }
}

// Get the currently playing show based on the current time
export function getCurrentShow() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  // Get current day of week (0 = Sunday, 6 = Saturday)
  const currentDay = now.getDay();
  
  // Map day number to day name
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayName = dayNames[currentDay];
  
  // Filter shows appropriate for today
  const todayShows = shows.filter(show => {
    return show.days.toLowerCase().includes(currentDayName);
  });

  // Find a show that's currently on air
  const currentShow = todayShows.find(show => {
    const [startTime, endTime] = show.time.split(' - ');
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    return isInTimeRange(currentTime, startMinutes, endMinutes, currentDay);
  });

  return currentShow || offStudioShow;
}

// Get upcoming shows for display in the app
export function getUpcomingShows(limit = 5) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Create a list of all possible shows for the next 48 hours
  const upcomingShows = [];
  
  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    const futureDay = (currentDay + dayOffset) % 7;
    const futureDayName = dayNames[futureDay];
    
    // Filter shows for this future day
    const dayShows = shows.filter(show => {
      return show.days.toLowerCase().includes(futureDayName);
    });
    
    // Add shows with adjusted times
    dayShows.forEach(show => {
      const [startTime] = show.time.split(' - ');
      const startMinutes = timeToMinutes(startTime);
      let showStartTime = startMinutes + (dayOffset * 24 * 60);
      
      // Only include shows that haven't started yet
      if (dayOffset === 0) {
        if (startMinutes <= currentTime) {
          return; // Skip shows that have already started today
        }
      }
      
      upcomingShows.push({
        ...show,
        actualStartTime: showStartTime,
        displayTime: dayOffset === 0 ? show.time : `Tomorrow ${show.time}`
      });
    });
  }

  // Sort by start time and take the first N shows
  return upcomingShows
    .sort((a, b) => a.actualStartTime - b.actualStartTime)
    .slice(0, limit)
    .map(({ actualStartTime, displayTime, ...show }) => ({
      ...show,
      time: displayTime
    }));
}

// Get all shows
export function getAllShows() {
  // Return all unique shows (by name)
  const uniqueShows = [];
  const showNames = new Set();
  
  shows.forEach(show => {
    if (!showNames.has(show.name)) {
      showNames.add(show.name);
      uniqueShows.push(show);
    }
  });
  
  return uniqueShows;
}

// Get show by ID
export function getShowById(id) {
  if (!id) return null;
  
  // ID format could be either:
  // 1. direct show name-time (from carousel)
  // 2. day-showname (from schedule)
  
  // Try the direct format first
  let show = shows.find(s => `${s.name}-${s.time}` === id);
  
  // If not found, try the day-name format
  if (!show && id.includes('-')) {
    const parts = id.split('-');
    if (parts.length >= 2) {
      const dayPrefix = parts[0];
      const showName = parts.slice(1).join('-');
      
      // Map dayPrefix to actual day name
      const dayMap = {
        'mon': 'monday',
        'tue': 'tuesday',
        'wed': 'wednesday',
        'thu': 'thursday',
        'fri': 'friday',
        'sat': 'saturday',
        'sun': 'sunday'
      };
      
      const day = dayMap[dayPrefix];
      
      // Find show with matching name and day
      show = shows.find(s => 
        s.name === showName && 
        s.days.toLowerCase().includes(day)
      );
    }
  }
  
  return show || null;
}

// Group shows by day of week
export function getShowsByDay() {
  const dayMap = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
  
  // Assign shows to appropriate days
  shows.forEach(show => {
    const daysLower = show.days.toLowerCase();
    
    if (daysLower.includes('monday')) {
      dayMap.monday.push({ ...show, id: `mon-${show.name}` });
    }
    
    if (daysLower.includes('tuesday')) {
      dayMap.tuesday.push({ ...show, id: `tue-${show.name}` });
    }
    
    if (daysLower.includes('wednesday')) {
      dayMap.wednesday.push({ ...show, id: `wed-${show.name}` });
    }
    
    if (daysLower.includes('thursday')) {
      dayMap.thursday.push({ ...show, id: `thu-${show.name}` });
    }
    
    if (daysLower.includes('friday')) {
      dayMap.friday.push({ ...show, id: `fri-${show.name}` });
    }
    
    if (daysLower.includes('saturday')) {
      dayMap.saturday.push({ ...show, id: `sat-${show.name}` });
    }
    
    if (daysLower.includes('sunday')) {
      dayMap.sunday.push({ ...show, id: `sun-${show.name}` });
    }
  });
  
  // Sort all shows by time
  Object.keys(dayMap).forEach(day => {
    dayMap[day].sort((a, b) => {
      const timeA = a.time.split(' - ')[0];
      const timeB = b.time.split(' - ')[0];
      const [hoursA, minutesA] = timeA.split(':').map(Number);
      const [hoursB, minutesB] = timeB.split(':').map(Number);
      
      return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
    });
  });
  
  return dayMap;
}

// Export the shows for direct access
export { shows, offStudioShow };

export default shows;