const mongoose = require('mongoose');
const User = require('../models/User');
const Sermon = require('../models/Sermon');
const Devotion = require('../models/Devotion');
const Event = require('../models/Event');
const Ministry = require('../models/Ministry');
const Contact = require('../models/Contact');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

require('dotenv').config();

// Function to get video duration using ffmpeg
const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .ffprobe((err, data) => {
        if (err) {
          console.error('Error getting video metadata:', err);
          reject(err);
          return;
        }

        // Get duration in seconds and format as mm:ss or hh:mm:ss
        const totalSeconds = Math.floor(data.format.duration || 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let duration = '';
        if (hours > 0) {
          duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        resolve(duration);
      });
  });
};

// Function to update existing sermons with missing durations
const updateSermonDurations = async () => {
  try {
    console.log('Checking for sermons without durations...');

    // Find sermons that have videoUrl but no duration
    const sermonsWithoutDuration = await Sermon.find({
      videoUrl: { $exists: true, $ne: null },
      $or: [
        { duration: { $exists: false } },
        { duration: null },
        { duration: '' },
        { duration: '00:00' }
      ]
    });

    console.log(`Found ${sermonsWithoutDuration.length} sermons without valid durations`);

    for (const sermon of sermonsWithoutDuration) {
      try {
        // Check if video file exists
        const videoPath = path.join(__dirname, '../uploads/videos', path.basename(sermon.videoUrl));
        console.log(`Checking video: ${videoPath}`);

        if (fs.existsSync(videoPath)) {
          console.log(`Getting duration for: ${sermon.title}`);
          const duration = await getVideoDuration(videoPath);
          console.log(`Duration found: ${duration} for ${sermon.title}`);

          // Update the sermon with the duration
          await Sermon.findByIdAndUpdate(sermon._id, { duration: duration });
          console.log(`Updated ${sermon.title} with duration: ${duration}`);
        } else {
          console.log(`Video file not found for: ${sermon.title} at ${videoPath}`);
        }
      } catch (error) {
        console.error(`Error processing ${sermon.title}:`, error.message);
      }
    }

    console.log('Duration update process completed');
  } catch (error) {
    console.error('Error updating sermon durations:', error);
  }
};

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to database');

    // Update existing sermon durations first
    await updateSermonDurations();

    // Create admin user
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      const admin = new User({
        name: 'Admin User',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created');
    }

    // Seed sample sermons
    const sermons = [
      {
        title: 'The Power of Prayer',
        speaker: 'Pastor Daniel Kaggwa',
        description: 'Understanding the importance of prayer in our daily walk with God',
        scripture: 'Philippians 4:6-7',
        date: new Date('2025-11-10'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '45:30',
        tags: ['prayer', 'faith', 'spiritual-growth'],
        viewCount: 1250,
        isPublished: true,
        isFeatured: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Fruit of the Spirit: Love',
        speaker: 'Pastor Erica Kaggwa',
        description: 'Exploring God\'s love and how it manifests in our lives',
        scripture: 'Galatians 5:22',
        date: new Date('2025-11-03'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '42:15',
        tags: ['love', 'holy-spirit', 'character'],
        viewCount: 980,
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Walking in Faith',
        speaker: 'Evangelist Jonah',
        description: 'Building unwavering faith in God\'s promises',
        scripture: 'Hebrews 11:1',
        date: new Date('2025-10-27'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '38:45',
        tags: ['faith', 'trust', 'promises'],
        viewCount: 756,
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Married Couples Ministry',
        speaker: 'Pastor Daniel Kaggwa',
        description: 'Building strong Christian marriages and families',
        scripture: 'Ephesians 5:25',
        date: new Date('2025-10-20'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '52:10',
        tags: ['marriage', 'family', 'relationships'],
        viewCount: 892,
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Youth Empowerment',
        speaker: 'Youth Leader Michael',
        description: 'Equipping the next generation for God\'s purpose',
        scripture: 'Jeremiah 1:5',
        date: new Date('2025-10-13'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '41:20',
        tags: ['youth', 'purpose', 'calling'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Children of God',
        speaker: 'Children Ministry Leader',
        description: 'Teaching children about God\'s love and salvation',
        scripture: 'Matthew 19:14',
        date: new Date('2025-10-06'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '35:15',
        tags: ['children', 'salvation', 'love'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Evangelism: Spreading the Gospel',
        speaker: 'Evangelism Team',
        description: 'Training believers to share the good news effectively',
        scripture: 'Matthew 28:19-20',
        date: new Date('2025-09-29'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '48:30',
        tags: ['evangelism', 'gospel', 'mission'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Intercessions: Standing in the Gap',
        speaker: 'Prayer Team Leader',
        description: 'The power and importance of intercessory prayer',
        scripture: 'Ezekiel 22:30',
        date: new Date('2025-09-22'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '44:45',
        tags: ['prayer', 'intercession', 'spiritual-warfare'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Worship: Heart of the Church',
        speaker: 'Worship Leader Sarah',
        description: 'Understanding true worship and its importance',
        scripture: 'John 4:23-24',
        date: new Date('2025-09-15'),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '39:20',
        tags: ['worship', 'praise', 'heart'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      }
    ];

    for (const sermonData of sermons) {
      const existing = await Sermon.findOne({ title: sermonData.title });
      if (!existing) {
        const sermon = new Sermon(sermonData);
        await sermon.save();
        console.log(`Sermon "${sermonData.title}" created`);
      }
    }

    // Clear only seeded devotions (those with author 'Dove Ministries')
    const seededDevotionsDeleted = await Devotion.deleteMany({ author: 'Dove Ministries' });
    console.log(`Cleared ${seededDevotionsDeleted.deletedCount} seeded devotions`);

    // Seed sample devotions with categories for admin management
    const devotions = [
      // Faith Foundation
      {
        title: 'God\'s Unconditional Love',
        scripture: 'John 3:16',
        content: '"For God so loved the world that he gave his one and only Son..."',
        reflection: 'God\'s love is unconditional and everlasting. It reaches out to every person regardless of their background or circumstances.',
        prayer: 'Thank you Lord for your amazing love that knows no bounds.',
        date: new Date('2025-11-17'),
        author: 'Dove Ministries',
        category: 'faith-foundation',
        tags: ['love', 'salvation', 'grace'],
        isPublished: true,
        isFeatured: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'The Power of Faith',
        scripture: 'Hebrews 11:1',
        content: '"Now faith is confidence in what we hope for and assurance about what we do not see."',
        reflection: 'Faith is the foundation of our relationship with God. It allows us to trust in His promises even when we cannot see the outcome.',
        prayer: 'Lord, strengthen my faith and help me to trust in Your perfect plan.',
        date: new Date('2025-11-16'),
        author: 'Dove Ministries',
        category: 'faith-foundation',
        tags: ['faith', 'trust', 'promises'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Walking in Grace',
        scripture: 'Ephesians 2:8-9',
        content: '"For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast."',
        reflection: 'Salvation comes through God\'s grace, not our own efforts. This frees us to serve Him out of love rather than obligation.',
        prayer: 'Thank you for Your grace that covers all my shortcomings.',
        date: new Date('2025-11-15'),
        author: 'Dove Ministries',
        category: 'faith-foundation',
        tags: ['grace', 'salvation', 'freedom'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'The Fruit of the Spirit',
        scripture: 'Galatians 5:22-23',
        content: '"But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control."',
        reflection: 'As we grow in our relationship with God, these qualities should naturally manifest in our lives.',
        prayer: 'Holy Spirit, cultivate these fruits in my life and help me to reflect Your character.',
        date: new Date('2025-11-14'),
        author: 'Dove Ministries',
        category: 'faith-foundation',
        tags: ['holy-spirit', 'character', 'fruit'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'God\'s Promises',
        scripture: 'Jeremiah 29:11',
        content: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
        reflection: 'God has good plans for each of us. Even when life seems uncertain, we can trust in His perfect timing and purpose.',
        prayer: 'Lord, help me to trust in Your plans and timing for my life.',
        date: new Date('2025-11-13'),
        author: 'Dove Ministries',
        category: 'faith-foundation',
        tags: ['promises', 'plans', 'hope'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      // Love & Relationships
      {
        title: 'Love Your Neighbor',
        scripture: 'Mark 12:31',
        content: '"Love your neighbor as yourself." There is no commandment greater than these.',
        reflection: 'God calls us to love our neighbors as ourselves, showing compassion and care to everyone around us.',
        prayer: 'Help me to love others as You have loved me, Lord.',
        date: new Date('2025-11-12'),
        author: 'Dove Ministries',
        category: 'love-relationships',
        tags: ['love', 'relationships', 'compassion'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Forgiveness in Relationships',
        scripture: 'Colossians 3:13',
        content: '"Bear with each other and forgive one another if any of you has a grievance against someone."',
        reflection: 'Forgiveness is essential for healthy relationships and reflects God\'s forgiveness towards us.',
        prayer: 'Teach me to forgive others as You have forgiven me.',
        date: new Date('2025-11-11'),
        author: 'Dove Ministries',
        category: 'love-relationships',
        tags: ['forgiveness', 'relationships', 'healing'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Building Godly Friendships',
        scripture: 'Proverbs 27:17',
        content: '"As iron sharpens iron, so one person sharpens another."',
        reflection: 'Godly friendships help us grow spiritually and become better versions of ourselves.',
        prayer: 'Lead me to godly friends who will help me grow in You.',
        date: new Date('2025-11-10'),
        author: 'Dove Ministries',
        category: 'love-relationships',
        tags: ['friendship', 'growth', 'community'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Honoring Marriage',
        scripture: 'Ephesians 5:25',
        content: '"Husbands, love your wives, just as Christ loved the church and gave himself up for her."',
        reflection: 'Marriage is a sacred covenant that reflects Christ\'s love for the church.',
        prayer: 'Bless marriages and help couples honor their commitments.',
        date: new Date('2025-11-09'),
        author: 'Dove Ministries',
        category: 'love-relationships',
        tags: ['marriage', 'commitment', 'love'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Family Unity',
        scripture: 'Psalm 133:1',
        content: '"How good and pleasant it is when God\'s people live together in unity!"',
        reflection: 'Family unity brings blessing and strength to all members.',
        prayer: 'Help families to live in unity and love.',
        date: new Date('2025-11-08'),
        author: 'Dove Ministries',
        category: 'love-relationships',
        tags: ['family', 'unity', 'blessing'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      // Spiritual Growth
      {
        title: 'Daily Bible Reading',
        scripture: 'Psalm 119:105',
        content: '"Your word is a lamp for my feet, a light on my path."',
        reflection: 'Regular Bible reading illuminates our path and guides our decisions.',
        prayer: 'Help me to read Your Word daily and apply it to my life.',
        date: new Date('2025-11-07'),
        author: 'Dove Ministries',
        category: 'spiritual-growth',
        tags: ['bible', 'reading', 'guidance'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Prayer Life',
        scripture: '1 Thessalonians 5:17',
        content: '"Pray continually."',
        reflection: 'Prayer is our direct communication with God and should be constant.',
        prayer: 'Teach me to pray without ceasing.',
        date: new Date('2025-11-06'),
        author: 'Dove Ministries',
        category: 'spiritual-growth',
        tags: ['prayer', 'communication', 'discipline'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Spiritual Disciplines',
        scripture: '1 Timothy 4:7-8',
        content: '"Train yourself to be godly. For physical training is of some value, but godliness has value for all things."',
        reflection: 'Spiritual disciplines help us grow in godliness and prepare us for eternal life.',
        prayer: 'Help me develop spiritual disciplines that draw me closer to You.',
        date: new Date('2025-11-05'),
        author: 'Dove Ministries',
        category: 'spiritual-growth',
        tags: ['discipline', 'godliness', 'training'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Obedience to God',
        scripture: 'John 14:15',
        content: '"If you love me, keep my commands."',
        reflection: 'True love for God is demonstrated through obedience to His Word.',
        prayer: 'Give me a heart that loves You and obeys Your commands.',
        date: new Date('2025-11-04'),
        author: 'Dove Ministries',
        category: 'spiritual-growth',
        tags: ['obedience', 'love', 'commands'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Growing in Wisdom',
        scripture: 'Proverbs 2:6',
        content: '"For the Lord gives wisdom; from his mouth come knowledge and understanding."',
        reflection: 'God is the source of all true wisdom and understanding.',
        prayer: 'Grant me wisdom from above to live rightly.',
        date: new Date('2025-11-03'),
        author: 'Dove Ministries',
        category: 'spiritual-growth',
        tags: ['wisdom', 'knowledge', 'understanding'],
        isPublished: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      }
    ];

    for (const devotionData of devotions) {
      const existing = await Devotion.findOne({ title: devotionData.title });
      if (!existing) {
        const devotion = new Devotion(devotionData);
        await devotion.save();
        console.log(`Devotion "${devotionData.title}" created`);
      }
    }

    // Seed sample events
    const events = [
      {
        title: 'Transformation Conference',
        description: 'A week of transformation and discovering who you were born to be in God\'s Kingdom',
        date: new Date('2025-11-17'),
        endDate: new Date('2025-11-23'),
        location: 'The Sign Of The Dove Church - Kyazanga',
        category: 'conference',
        speaker: 'Pastor Daniel Kaggwa',
        time: '9:00 AM - 4:00 PM',
        maxAttendees: 500,
        isPublished: true,
        isFeatured: true,
        tags: ['conference', 'transformation', 'kingdom'],
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: '20th Anniversary Celebration',
        description: 'Join us as we celebrate 20 years of Dove Church in Uganda',
        date: new Date('2025-12-01'),
        endDate: new Date('2025-12-04'),
        location: 'The Sign Of The Dove Church - Zana',
        category: 'service',
        speaker: 'Dove Ministries Leadership',
        time: '9:00 AM - 6:00 PM',
        maxAttendees: 1000,
        isPublished: true,
        isFeatured: true,
        tags: ['anniversary', 'celebration', 'thanksgiving'],
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Sunday Special Service',
        description: 'Divine Healing & Restoration service',
        date: new Date('2025-11-01'),
        location: 'The Sign Of The Dove Church - Zana',
        category: 'service',
        speaker: 'Guest Minister',
        time: '4:00 PM - 7:00 PM',
        isPublished: true,
        tags: ['healing', 'restoration', 'special-service'],
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        title: 'Youth Camp 2026',
        description: 'Empowering the next generation for God\'s purpose',
        date: new Date('2026-01-15'),
        endDate: new Date('2026-01-20'),
        location: 'Kyazanga Retreat Center',
        category: 'youth',
        speaker: 'Youth Leadership Team',
        time: '9:00 AM - 6:00 PM',
        maxAttendees: 200,
        isPublished: true,
        tags: ['youth', 'camp', 'empowerment'],
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      }
    ];

    for (const eventData of events) {
      const existing = await Event.findOne({ title: eventData.title });
      if (!existing) {
        const event = new Event(eventData);
        await event.save();
        console.log(`Event "${eventData.title}" created`);
      }
    }

    // Seed sample ministries
    const ministries = [
      {
        name: 'Married Couples Ministry',
        description: 'Supporting and strengthening Christian marriages through fellowship, counseling, and biblical teaching.',
        leader: 'Pastor Daniel & Erica Kaggwa',
        activities: ['Marriage counseling', 'Couples fellowship', 'Relationship workshops', 'Prayer support'],
        meetingSchedule: 'Second Saturday of each month, 2:00 PM - 5:00 PM',
        contactEmail: 'marriedcouples@doveministriesafrica.org',
        contactPhone: '+256 772824677',
        category: 'married-couples',
        memberCount: 85,
        isActive: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        name: 'Youth Ministry',
        description: 'Equipping young people with biblical knowledge, leadership skills, and a heart for God\'s service.',
        leader: 'Youth Pastor Michael',
        activities: ['Bible study', 'Leadership training', 'Community outreach', 'Sports ministry', 'Music worship'],
        meetingSchedule: 'Every Friday, 6:00 PM - 8:00 PM',
        contactEmail: 'youth@doveministriesafrica.org',
        contactPhone: '+256 700116734',
        category: 'youth',
        memberCount: 120,
        isActive: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        name: 'Children Ministry',
        description: 'Teaching children about God\'s love through age-appropriate Bible stories, songs, and activities.',
        leader: 'Children Coordinator Sarah',
        activities: ['Sunday school', 'Vacation Bible school', 'Children\'s choir', 'Birthday celebrations'],
        meetingSchedule: 'Every Sunday, 9:00 AM - 11:00 AM',
        contactEmail: 'children@doveministriesafrica.org',
        contactPhone: '+256 772824677',
        category: 'children',
        memberCount: 95,
        isActive: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        name: 'Evangelism Ministry',
        description: 'Reaching out to the community with the gospel of Jesus Christ through various outreach programs.',
        leader: 'Evangelist Jonah',
        activities: ['Door-to-door evangelism', 'Community outreach', 'Hospital ministry', 'Prison ministry'],
        meetingSchedule: 'Every Wednesday, 5:00 PM - 7:00 PM',
        contactEmail: 'evangelism@doveministriesafrica.org',
        contactPhone: '+256 700116734',
        category: 'evangelism',
        memberCount: 45,
        isActive: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        name: 'Intercessions Ministry',
        description: 'Dedicated to praying for the church, community, nation, and the world\'s needs.',
        leader: 'Prayer Coordinator Grace',
        activities: ['24/7 prayer chain', 'Prayer meetings', 'Prayer retreats', 'Intercessory training'],
        meetingSchedule: 'Every Wednesday, 8:00 AM - 2:00 PM & 6:00 PM - 8:00 PM',
        contactEmail: 'prayer@doveministriesafrica.org',
        contactPhone: '+256 772824677',
        category: 'intercessions',
        memberCount: 65,
        isActive: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      },
      {
        name: 'Worship Ministry',
        description: 'Leading the congregation in worship through music, dance, and creative arts.',
        leader: 'Worship Leader David',
        activities: ['Sunday services', 'Special programs', 'Worship team training', 'Music production'],
        meetingSchedule: 'Every Saturday, 6:00 PM - 9:00 PM',
        contactEmail: 'worship@doveministriesafrica.org',
        contactPhone: '+256 700116734',
        category: 'worship',
        memberCount: 35,
        isActive: true,
        createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
      }
    ];

    for (const ministryData of ministries) {
      const existing = await Ministry.findOne({ name: ministryData.name });
      if (!existing) {
        const ministry = new Ministry(ministryData);
        await ministry.save();
        console.log(`Ministry "${ministryData.name}" created`);
      }
    }

    // Seed contact info
    await Contact.deleteMany(); // Clear existing contacts
    const contact = new Contact({
      churchName: 'Dove Ministries Africa',
      address: 'Nfuufu Zone\nZzana-Bunamwaya, Kampala',
      phone: '+256 772824677',
      email: 'thesignofthedove ministries@gmail.com',
      serviceTimes: 'Sundays: 8:00 AM & 10:30 AM\nWednesdays: 7:00 PM',
      about: 'Transforming lives through faith, community, and service across Africa. Founded in 2005 by Pastor Daniel and Erica Kaggwa.',
      mission: 'To take the gospel of Jesus Christ to the lost and assimilate them into a church community where they may grow spiritually.',
      founders: [
        {
          name: 'Pastor Daniel Kaggwa',
          title: 'Co-Founder & Senior Pastor',
          imageUrl: '/uploads/thumbnails/thumbnail-1765908896901-261573926.jpg'
        },
        {
          name: 'Erica Kaggwa',
          title: 'Co-Founder & Ministry Leader',
          imageUrl: '/uploads/thumbnails/thumbnail-1765908896901-261573926.jpg'
        }
      ],
      isPublished: true,
      createdBy: adminExists ? adminExists._id : (await User.findOne({ email: process.env.ADMIN_EMAIL }))._id
    });
    await contact.save();
    console.log('Contact information created');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeder or update durations only
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--update-durations')) {
    // Connect and update durations only
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dove-ministries', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(async () => {
      console.log('Connected to database for duration update');
      await updateSermonDurations();
      await mongoose.connection.close();
      console.log('Duration update completed');
    }).catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
  } else {
    seedData();
  }
}