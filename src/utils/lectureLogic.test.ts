import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LECTURE_CATEGORIES,
  PROTECTED_STARTER_LECTURES,
  filterLectures,
  getRecommendedLectures,
  isEligibleLectureMember,
  parseYouTubeLectureUrl,
  validateLectureSubmission,
} from './lectureLogic';

test('supports all 11 required lecture categories', () => {
  const required = [
    'Classes 1-5',
    'Classes 6-8',
    'Classes 9-10',
    'Classes 11-12',
    'JEE',
    'NEET',
    'UPSC',
    'College Education',
    'Skill Development',
    'Language Learning',
    'General Knowledge',
  ];
  assert.deepEqual(LECTURE_CATEGORIES, required);
});

test('parseYouTubeLectureUrl validates official YouTube formats and rejects non-YouTube or HTTP links', () => {
  const watch = parseYouTubeLectureUrl('https://www.youtube.com/watch?v=IlNAJl36-10');
  assert.equal(watch.valid, true);
  assert.equal(watch.videoId, 'IlNAJl36-10');
  assert.match(watch.embedUrl || '', /^https:\/\/www\.youtube-nocookie\.com\/embed\/IlNAJl36-10/);

  const shortUrl = parseYouTubeLectureUrl('https://youtu.be/ZM8ECpBuQYE?si=abc');
  assert.equal(shortUrl.valid, true);
  assert.equal(shortUrl.videoId, 'ZM8ECpBuQYE');

  const httpRejected = parseYouTubeLectureUrl('http://www.youtube.com/watch?v=IlNAJl36-10');
  assert.equal(httpRejected.valid, false);

  const randomSite = parseYouTubeLectureUrl('https://evil.example.com/watch?v=IlNAJl36-10');
  assert.equal(randomSite.valid, false);
});

test('isEligibleLectureMember blocks guests and free users and allows active paid members or admins', () => {
  assert.equal(isEligibleLectureMember({ isAuthenticated: false }), false);
  assert.equal(
    isEligibleLectureMember({
      isAuthenticated: true,
      planId: 'free',
      membershipStatus: 'active',
    }),
    false
  );
  assert.equal(
    isEligibleLectureMember({
      isAuthenticated: true,
      planId: 'student',
      membershipStatus: 'expired',
    }),
    false
  );
  assert.equal(
    isEligibleLectureMember({
      isAuthenticated: true,
      planId: 'student',
      membershipStatus: 'active',
    }),
    true
  );
  assert.equal(
    isEligibleLectureMember({
      isAuthenticated: true,
      planId: 'pro',
      membershipStatus: 'active',
    }),
    true
  );
  assert.equal(
    isEligibleLectureMember({
      isAuthenticated: true,
      isAdmin: true,
      planId: 'free',
    }),
    true
  );
});

test('validateLectureSubmission validates YouTube, Original, and Teacher lecture inputs', () => {
  const validYt = validateLectureSubmission({
    title: 'Newton Laws Complete Revision',
    description: 'Detailed Hinglish lecture on Newton laws of motion and friction.',
    sourceType: 'youtube',
    category: 'Classes 11-12',
    className: 'Class 11',
    subject: 'Physics',
    chapterNumber: 5,
    chapterName: 'Laws of Motion',
    teacherName: 'Prof. Sharma',
    videoUrl: 'https://www.youtube.com/watch?v=ZM8ECpBuQYE',
  });
  assert.equal(validYt.valid, true);

  const invalidYt = validateLectureSubmission({
    title: 'Newton Laws Complete Revision',
    description: 'Detailed Hinglish lecture on Newton laws of motion and friction.',
    sourceType: 'youtube',
    category: 'Classes 11-12',
    className: 'Class 11',
    subject: 'Physics',
    chapterNumber: 5,
    chapterName: 'Laws of Motion',
    teacherName: 'Prof. Sharma',
    videoUrl: 'https://vimeo.com/123456',
  });
  assert.equal(invalidYt.valid, false);
});

test('filterLectures and getRecommendedLectures filter accurately across source, category, and search', () => {
  const ytOnly = filterLectures(PROTECTED_STARTER_LECTURES, { sourceType: 'youtube' });
  assert.ok(ytOnly.length > 0);
  assert.equal(ytOnly.every((l) => l.sourceType === 'youtube'), true);

  const jeeOnly = filterLectures(PROTECTED_STARTER_LECTURES, { category: 'JEE' });
  assert.equal(jeeOnly.length, 1);

  const searchRes = filterLectures(PROTECTED_STARTER_LECTURES, { search: 'binary trees' });
  assert.equal(searchRes.length, 1);

  const recs = getRecommendedLectures(PROTECTED_STARTER_LECTURES[0], PROTECTED_STARTER_LECTURES, 3);
  assert.equal(recs.length, 3);
  assert.equal(recs.some((r) => r.id === PROTECTED_STARTER_LECTURES[0].id), false);
});
