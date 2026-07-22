import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('should return healthy status', () => {
    const result = controller.getHealth();

    expect(result).toEqual({ status: 'Healthy' });
  });
});
