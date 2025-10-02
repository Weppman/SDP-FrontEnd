import {
  getCompletionPercent,
  getHikeStats,
  toggleSlice,
  getTrailCounts,
  buildSunburstLegend,
} from './statsUtils';

const mockUserGoals = [
  { id: 1, title: 'Hike 10 miles', done: false },
  { id: 2, title: 'Climb a mountain', done: true },
];

const mockGlobalGoals = [{ id: 1, title: 'Complete 5 hikes' }];
const mockCompletedGoals = [
  { id: 1, title: 'Hike 5 miles', source: 'personal' },
  { id: 2, title: 'Complete a trail', source: 'global' },
];

const completedHikesData = {
  completed_hike_table: [
    { id: 1, trailid: 101, date: '2023-06-15' },
    { id: 2, trailid: 102, date: '2023-06-22' },
    { id: 3, trailid: 101, date: '2023-07-10' },
  ],
  trail: [
    { trailid: 101, name: 'Forest Trail' },
    { trailid: 102, name: 'Mountain Path' },
  ],
};
describe('Utility Functions', () => {
  test('FE_UTILS_001 calculates completion percentage', () => {
    expect(getCompletionPercent(mockUserGoals, mockGlobalGoals, mockCompletedGoals)).toBe(50);
  });

  test('FE_UTILS_002 processes hike stats', () => {
    const stats = getHikeStats(completedHikesData);
    expect(stats.totalHikes).toBe(3);
    expect(stats.longestMonth).toBe(2); // June
    expect(stats.longestMonthName).toContain('June');
    expect(stats.latestHikeDate).toBe(new Date('2023-07-10').toLocaleDateString());
  });

  test('FE_UTILS_003 toggles chart slice', () => {
    expect(toggleSlice([], 1)).toEqual([1]);
    expect(toggleSlice([1], 1)).toEqual([]);
  });

  test('FE_UTILS_004 retrieves trail counts', () => {
    const result = getTrailCounts(completedHikesData);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ trail: 'Forest Trail', count: 2 }),
        expect.objectContaining({ trail: 'Mountain Path', count: 1 }),
      ]),
    );
  });

  test('FE_UTILS_005 displays sunburst legend', () => {
    const monthNodes = [
      { id: 'center' },
      { id: 'm0', name: 'June', value: 2 },
      { id: 'm1', name: 'July', value: 1 },
    ];
    const legend = buildSunburstLegend(monthNodes);
    expect(legend).toEqual([
      { id: 'm0', name: 'June', value: 2, color: undefined },
      { id: 'm1', name: 'July', value: 1, color: undefined },
    ]);
  });
});