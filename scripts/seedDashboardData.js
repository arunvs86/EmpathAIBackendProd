// scripts/seedDashboardData.js
// ----------------------
// Faker-based seeder for Postgres (Sequelize) & MongoDB (Mongoose)
// Usage: 
//   MONGO_URI="mongodb://localhost:27017/grief_app" \
//   node scripts/seedDashboardData.js

import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import {sequelize} from '../config/postgres.js';

// Sequelize models
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';
import Appointment from '../models/Appointments.js';
import Therapist from '../models/Therapist.js';
import TherapySession from '../models/TherapySession.js';

// Mongoose models
import Journal from '../models/Journal.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import UserViolations from '../models/UserViolations.js';
import AdminActions from '../models/AdminActions.js';

async function seed() {
  try {
    // 1. Connect to Postgres
    await sequelize.sync({ force: true });
    console.log('✅ Postgres synced');

    // 2. Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/grief_app';
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ MongoDB connected');

    // 3. Seed Users & Activities
    const users = [];
    for (let i = 0; i < 50; i++) {
      const u = await User.create({
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: 'pass', password_hash: 'hash',
        role: 'user', email_verified: true,
        dob: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
        country: faker.address.country(), city: faker.address.city(),
        current_feelings: faker.helpers.arrayElements(['happy','sad','anxious','stressed'], 2),
        last_login: faker.date.recent(30)
      });
      users.push(u);
      await UserActivity.create({
        user_id: u.id,
        login_time: faker.date.recent(10),
        logout_time: faker.date.recent(9)
      });
    }
    console.log('✅ Users & Activities seeded');

    // 4. Seed Journal Entries
    for (const u of users.slice(0, 40)) {
      const count =  faker.number.int({ min: 0, max: 10 });
      for (let j = 0; j < count; j++) {
        await Journal.create({
          userId: u.id,
          date: faker.date.past(0.5),
          body: faker.lorem.paragraph(),
          mood: faker.helpers.arrayElement(['😃','😔','😡','😌']),
          tags: faker.helpers.arrayElements(['hope','loss','healing','family','memories'], 3)
        });
      }
    }
    console.log('✅ Journal entries seeded');

    // 5. Seed Therapists & Appointments & Sessions
    const therapists = [];
    for (let i = 0; i < 10; i++) {
      const tUser = await User.create({
        username: faker.internet.userName(), email: faker.internet.email(),
        password: 'pass', password_hash: 'hash', role: 'therapist', email_verified:true,
        dob: faker.date.birthdate({ min: 25, max: 65, mode: 'age' }),
        country: faker.address.country(), city: faker.address.city()
      });
      const t = await Therapist.create({
        user_id: tUser.id,
        experience_years:  faker.number.int({ min: 1, max: 20 }),
        license_number: faker.string.alphanumeric(8),
        languages_spoken: faker.helpers.arrayElements(['en','es','fr','de'], 2),
        verified: true,
        ratings: faker.number.float({ min: 3, max: 5, precision: 0.1 })
      });
      therapists.push(t);
    }
    const appointments = [];
    for (let u of users.slice(0, 40)) {
      const count =  faker.number.int({ min: 1, max: 5 });
      for (let j = 0; j < count; j++) {
        const status = faker.helpers.arrayElement(['pending','confirmed','completed','cancelled','no_show']);
        const ap = await Appointment.create({
          user_id: u.id,
          therapist_id: faker.helpers.arrayElement(therapists).id,
          scheduled_at: faker.date.recent(30),
          status,
          primary_concern: faker.lorem.word(),
          session_goals: faker.helpers.arrayElements(['cope','grieve','move on'], 2)
        });
        appointments.push(ap);
      }
    }
    console.log('✅ Appointments seeded');

    for (const ap of appointments.filter(a => a.status === 'completed')) {
      await TherapySession.create({
        appointment_id: ap.id,
        user_id: ap.user_id,
        therapist_id: ap.therapist_id,
        note_type: 'session_feedback',
        session_rating:  faker.number.int({ min: 1, max: 5 }),
        therapist_rating:  faker.number.int({ min: 1, max: 5 })
      });
    }
    console.log('✅ Therapy sessions seeded');

    // 6. Seed Communities
    const communities = [];
    for (let i = 0; i < 5; i++) {
      const c = await Community.create({
        name: faker.lorem.words(2),
        description: faker.lorem.sentence(),
        type: 'public',
        createdBy: faker.helpers.arrayElement(users).id
      });
      communities.push(c);
    }
    console.log('✅ Communities seeded');

    // 7. Seed Chats & Messages
    for (let i = 0; i < 20; i++) {
      const participants = faker.helpers.arrayElements(users.map(u => u.id), 2);
      const chat = await Chat.create({ participants });
      const msgCount =  faker.number.int({ min: 5, max: 20 });
      for (let j = 0; j < msgCount; j++) {
        await Message.create({
          chatId: chat._id,
          messages: [{ senderId: faker.helpers.arrayElement(participants), content: faker.lorem.sentence() }]
        });
      }
    }
    console.log('✅ Chats & Messages seeded');

    // 8. Seed Posts & Comments
    for (const c of communities) {
      const postCount =  faker.number.int({ min: 5, max: 15 });
      for (let i = 0; i < postCount; i++) {
        const p = await Post.create({
          userId: faker.helpers.arrayElement(users).id,
          content: faker.lorem.sentences(2),
          communityId: c._id
        });
        const cmCount =  faker.number.int({ min: 0, max: 5 });
        for (let j = 0; j < cmCount; j++) {
          p.comments.push({ userId: faker.helpers.arrayElement(users).id, text: faker.lorem.sentence() });
        }
        await p.save();
      }
    }
    console.log('✅ Posts & Comments seeded');

    // 9. Seed Violations & AdminActions
    for (let i = 0; i < 10; i++) {
      const viol = await UserViolations.create({
        user_id: faker.helpers.arrayElement(users).id,
        reported_by: faker.helpers.arrayElement(users).id,
        violation_reason: faker.helpers.arrayElement(['abuse','spam','other']),
        severity: faker.helpers.arrayElement(['minor','major'])
      });
      await AdminActions.create({
        admin_id: faker.helpers.arrayElement(users).id,
        action_type: faker.helpers.arrayElement(['ban_user','warn_user','remove_post']),
        target_user_id: viol.user_id
      });
    }
    console.log('✅ Violations & AdminActions seeded');

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
