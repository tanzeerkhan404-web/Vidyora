import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LEARNING_PACKAGES,
  DEFAULT_MEMBERSHIP_PLANS,
} from '../data/membershipCatalog';
import {
  buildPlanComparisonRows,
  calculateEffectivePrice,
  canActivatePaidPlan,
  validateAdminPackageEdit,
  validateAdminPlanEdit,
} from './membershipLogic';

test('default membership catalog defines Free ₹0, Student ₹49, and Pro Learner ₹99', () => {
  assert.equal(DEFAULT_MEMBERSHIP_PLANS.length, 3);
  const free = DEFAULT_MEMBERSHIP_PLANS.find((p) => p.id === 'free');
  const student = DEFAULT_MEMBERSHIP_PLANS.find((p) => p.id === 'student');
  const pro = DEFAULT_MEMBERSHIP_PLANS.find((p) => p.id === 'pro');

  assert.equal(free?.priceInr, 0);
  assert.equal(student?.priceInr, 49);
  assert.equal(pro?.priceInr, 99);
});

test('default learning packages include School, College, and Competitive Exams with JEE/NEET/UPSC/SSC/Banking', () => {
  assert.equal(DEFAULT_LEARNING_PACKAGES.length, 3);
  const competitive = DEFAULT_LEARNING_PACKAGES.find((p) => p.id === 'competitive');
  assert.ok(competitive);
  const examNames = (competitive.examGroups || []).map((e) => e.name).join(' ');
  assert.match(examNames, /JEE/);
  assert.match(examNames, /NEET/);
  assert.match(examNames, /UPSC/);
  assert.match(examNames, /SSC/);
  assert.match(examNames, /Banking/);
});

test('calculateEffectivePrice applies active offer discounts safely and preserves ₹0 free plan', () => {
  const freePrice = calculateEffectivePrice(DEFAULT_MEMBERSHIP_PLANS[0]);
  assert.equal(freePrice.finalPriceInr, 0);
  assert.equal(freePrice.hasActiveOffer, false);

  const discounted = calculateEffectivePrice({
    priceInr: 99,
    offer: { active: true, label: 'Exam Offer', discountPercent: 20, note: 'Test' },
  });
  assert.equal(discounted.hasActiveOffer, true);
  assert.equal(discounted.finalPriceInr, 79);
  assert.equal(discounted.savingsInr, 20);
});

test('canActivatePaidPlan strictly blocks paid plan activation without verified server payment confirmation', () => {
  assert.equal(canActivatePaidPlan('free'), true);
  assert.equal(canActivatePaidPlan('student', null), false);
  assert.equal(
    canActivatePaidPlan('student', {
      gatewayActive: false,
      verifiedByServer: true,
      planId: 'student',
      receiptId: 'rcpt_12345678',
    }),
    false
  );
  assert.equal(
    canActivatePaidPlan('pro', {
      gatewayActive: true,
      verifiedByServer: false,
      planId: 'pro',
      receiptId: 'rcpt_12345678',
    }),
    false
  );
  assert.equal(
    canActivatePaidPlan('pro', {
      gatewayActive: true,
      verifiedByServer: true,
      planId: 'pro',
      receiptId: 'rcpt_verified_99',
    }),
    true
  );
});

test('admin plan and package validators catch invalid edits and accept valid catalog items', () => {
  for (const plan of DEFAULT_MEMBERSHIP_PLANS) {
    assert.equal(validateAdminPlanEdit(plan).valid, true);
  }
  for (const pkg of DEFAULT_LEARNING_PACKAGES) {
    assert.equal(validateAdminPackageEdit(pkg).valid, true);
  }

  // Free plan cannot be given a non-zero price
  assert.equal(
    validateAdminPlanEdit({ ...DEFAULT_MEMBERSHIP_PLANS[0], priceInr: 25 }).valid,
    false
  );
  // Active offer must have valid discount %
  assert.equal(
    validateAdminPlanEdit({
      ...DEFAULT_MEMBERSHIP_PLANS[1],
      offer: { active: true, label: 'Promo', discountPercent: 0, note: '' },
    }).valid,
    false
  );
  // Package must have subjects
  assert.equal(
    validateAdminPackageEdit({ ...DEFAULT_LEARNING_PACKAGES[0], subjects: [] }).valid,
    false
  );
});

test('buildPlanComparisonRows builds complete side-by-side rows', () => {
  const rows = buildPlanComparisonRows(DEFAULT_MEMBERSHIP_PLANS);
  assert.ok(rows.length >= 6);
  assert.equal(rows[0].free, '₹0 (Forever)');
  assert.equal(rows[0].student, '₹49/month');
  assert.equal(rows[0].pro, '₹99/month');
});
