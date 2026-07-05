import type { Alert, AlertFilters, AlertRepository } from '../../domain/alert/alert.repository.js';

export class ListAlertsUseCase {
  constructor(private readonly alertRepository: AlertRepository) {}

  async execute(filters?: AlertFilters): Promise<Alert[]> {
    return this.alertRepository.findAll(filters);
  }
}
