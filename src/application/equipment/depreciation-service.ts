import { Result, UniqueEntityID, Money } from '@domain/shared'
import type {
  Equipment,
  EquipmentRepository,
  DepreciationMethod,
} from '@domain/equipment'

/**
 * Depreciation Application Service
 * Orchestrates depreciation calculations and ROI analysis use cases
 */

// ============================================================================
// Input Types
// ============================================================================

export type CalculateDepreciationInput = {
  equipmentId: string
  asOfDate?: Date
}

export type UpdateDepreciationSettingsInput = {
  equipmentId: string
  depreciationMethod?: DepreciationMethod
  salvageValue?: number
  usefulLifeYears?: number
}

export type CalculateROIInput = {
  equipmentId: string
  totalRevenue: number
  totalOperatingCost?: number
}

// ============================================================================
// Output Types
// ============================================================================

export type DepreciationCalculationDTO = {
  equipmentId: string
  assetNumber: string
  method: DepreciationMethod
  acquisitionCost: number
  salvageValue: number
  usefulLifeYears: number
  currentAge: number
  annualDepreciation: number
  accumulatedDepreciation: number
  bookValue: number
  depreciationRate: number
  calculatedAt: Date
}

export type ROIAnalysisDTO = {
  equipmentId: string
  assetNumber: string
  name: string
  acquisitionCost: number
  currentValue: number
  totalRevenue: number
  totalMaintenanceCost: number
  totalOperatingCost: number
  netProfit: number
  roi: number // Percentage
  paybackPeriodMonths: number
  utilizationRate: number
  costPerHour: number
  revenuePerHour: number
  analysisDate: Date
}

export type DisposalRecommendationDTO = {
  equipmentId: string
  assetNumber: string
  name: string
  recommendedAction: 'SELL' | 'TRADE_IN' | 'SCRAP' | 'DONATE' | 'RETAIN'
  estimatedResaleValue: number
  marketConditions: 'STRONG' | 'MODERATE' | 'WEAK'
  optimalDisposalDate: Date
  reasoning: string
  alternativeOptions: Array<{
    action: string
    estimatedValue: number
    pros: string[]
    cons: string[]
  }>
  generatedAt: Date
}

export type FleetDepreciationSummary = {
  totalAcquisitionCost: number
  totalCurrentValue: number
  totalAccumulatedDepreciation: number
  totalBookValue: number
  averageAge: number
  equipmentCount: number
}

// ============================================================================
// Depreciation Service
// ============================================================================

export class DepreciationService {
  private readonly equipmentRepo: EquipmentRepository
  private readonly DEFAULT_USEFUL_LIFE_YEARS = 10

  constructor(equipmentRepo: EquipmentRepository) {
    this.equipmentRepo = equipmentRepo
  }

  /**
   * Calculate depreciation for equipment
   */
  async calculateDepreciation(
    input: CalculateDepreciationInput,
  ): Promise<Result<DepreciationCalculationDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      const asOfDate = input.asOfDate || new Date()
      const calculation = this.computeDepreciation(equipment, asOfDate)

      return Result.ok(calculation)
    } catch (error) {
      return Result.fail(`Failed to calculate depreciation: ${error}`)
    }
  }

  /**
   * Calculate ROI for equipment
   */
  async calculateROI(input: CalculateROIInput): Promise<Result<ROIAnalysisDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      const acquisitionCost = equipment.acquisitionCost.amount
      const currentValue = equipment.currentValue.amount
      const totalOperatingCost = input.totalOperatingCost || 0

      // Calculate maintenance cost (simplified - in production would query maintenance records)
      const totalMaintenanceCost = 0 // TODO: Query from maintenance records

      // Calculate net profit
      const totalCost = acquisitionCost + totalMaintenanceCost + totalOperatingCost
      const netProfit = input.totalRevenue - totalCost

      // Calculate ROI percentage
      const roi = (netProfit / acquisitionCost) * 100

      // Calculate payback period in months
      const monthlyRevenue = input.totalRevenue / this.getMonthsSinceAcquisition(equipment)
      const monthlyCost = totalCost / this.getMonthsSinceAcquisition(equipment)
      const monthlyNetProfit = monthlyRevenue - monthlyCost
      const paybackPeriodMonths =
        monthlyNetProfit > 0 ? acquisitionCost / monthlyNetProfit : 0

      // Calculate utilization metrics
      const totalHours = equipment.totalOperatingHours.hours
      const utilizationRate = equipment.utilizationRate?.rate ?? 0
      const costPerHour = totalHours > 0 ? totalCost / totalHours : 0
      const revenuePerHour = totalHours > 0 ? input.totalRevenue / totalHours : 0

      const analysis: ROIAnalysisDTO = {
        equipmentId: equipment.id.toString(),
        assetNumber: equipment.assetNumber.value,
        name: equipment.name,
        acquisitionCost,
        currentValue,
        totalRevenue: input.totalRevenue,
        totalMaintenanceCost,
        totalOperatingCost,
        netProfit,
        roi,
        paybackPeriodMonths,
        utilizationRate,
        costPerHour,
        revenuePerHour,
        analysisDate: new Date(),
      }

      return Result.ok(analysis)
    } catch (error) {
      return Result.fail(`Failed to calculate ROI: ${error}`)
    }
  }

  /**
   * Generate disposal recommendation
   */
  async generateDisposalRecommendation(
    equipmentId: string,
  ): Promise<Result<DisposalRecommendationDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      const depreciation = this.computeDepreciation(equipment, new Date())
      const ageYears = depreciation.currentAge

      // Determine recommended action based on age, condition, and value
      let recommendedAction: DisposalRecommendationDTO['recommendedAction'] = 'RETAIN'
      let estimatedResaleValue = depreciation.bookValue * 0.8 // 80% of book value
      let reasoning = ''

      if (ageYears > this.DEFAULT_USEFUL_LIFE_YEARS * 1.5) {
        recommendedAction = 'SCRAP'
        estimatedResaleValue = depreciation.salvageValue
        reasoning = 'Equipment has exceeded 150% of useful life. Salvage value only remains.'
      } else if (ageYears > this.DEFAULT_USEFUL_LIFE_YEARS) {
        recommendedAction = 'SELL'
        estimatedResaleValue = depreciation.bookValue * 0.7
        reasoning =
          'Equipment has exceeded useful life but still has resale value. Selling now maximizes value recovery.'
      } else if (equipment.totalOperatingHours.hours > 15000) {
        recommendedAction = 'TRADE_IN'
        estimatedResaleValue = depreciation.bookValue * 0.85
        reasoning =
          'High operating hours indicate heavy use. Trade-in for newer model recommended.'
      } else if (equipment.isUnderMaintenance() || equipment.needsMaintenance()) {
        recommendedAction = 'RETAIN'
        reasoning = 'Equipment still within useful life. Complete maintenance and continue use.'
      } else {
        recommendedAction = 'RETAIN'
        reasoning = 'Equipment is in good condition and within useful life. Continue operations.'
      }

      // Determine market conditions (simplified)
      const marketConditions: DisposalRecommendationDTO['marketConditions'] =
        ageYears < 5 ? 'STRONG' : ageYears < 10 ? 'MODERATE' : 'WEAK'

      // Calculate optimal disposal date
      const optimalDisposalDate = new Date()
      optimalDisposalDate.setFullYear(
        equipment.acquisitionDate.getFullYear() + this.DEFAULT_USEFUL_LIFE_YEARS,
      )

      // Generate alternative options
      const alternativeOptions = [
        {
          action: 'Continue Operation',
          estimatedValue: depreciation.bookValue,
          pros: ['No transaction costs', 'Maintain operational capacity', 'Known equipment history'],
          cons: ['Increasing maintenance costs', 'Declining efficiency', 'Technology obsolescence'],
        },
        {
          action: 'Immediate Sale',
          estimatedValue: estimatedResaleValue,
          pros: ['Immediate cash recovery', 'Avoid future maintenance', 'Free up storage/resources'],
          cons: ['Loss of operational capacity', 'Below book value', 'Transaction costs'],
        },
        {
          action: 'Trade-In',
          estimatedValue: estimatedResaleValue * 1.1,
          pros: [
            'Better value than outright sale',
            'Upgrade to newer model',
            'Simplified transaction',
          ],
          cons: ['Dependent on dealer terms', 'Limited negotiation', 'Forced upgrade timeline'],
        },
      ]

      const recommendation: DisposalRecommendationDTO = {
        equipmentId: equipment.id.toString(),
        assetNumber: equipment.assetNumber.value,
        name: equipment.name,
        recommendedAction,
        estimatedResaleValue,
        marketConditions,
        optimalDisposalDate,
        reasoning,
        alternativeOptions,
        generatedAt: new Date(),
      }

      return Result.ok(recommendation)
    } catch (error) {
      return Result.fail(`Failed to generate disposal recommendation: ${error}`)
    }
  }

  /**
   * Get fleet depreciation summary
   */
  async getFleetDepreciationSummary(): Promise<Result<FleetDepreciationSummary>> {
    try {
      const allEquipment = await this.equipmentRepo.findAll()

      let totalAcquisitionCost = 0
      let totalCurrentValue = 0
      let totalAccumulatedDepreciation = 0
      let totalBookValue = 0
      let totalAge = 0

      for (const equipment of allEquipment) {
        const depreciation = this.computeDepreciation(equipment, new Date())

        totalAcquisitionCost += depreciation.acquisitionCost
        totalCurrentValue += equipment.currentValue.amount
        totalAccumulatedDepreciation += depreciation.accumulatedDepreciation
        totalBookValue += depreciation.bookValue
        totalAge += depreciation.currentAge
      }

      const summary: FleetDepreciationSummary = {
        totalAcquisitionCost,
        totalCurrentValue,
        totalAccumulatedDepreciation,
        totalBookValue,
        averageAge: allEquipment.length > 0 ? totalAge / allEquipment.length : 0,
        equipmentCount: allEquipment.length,
      }

      return Result.ok(summary)
    } catch (error) {
      return Result.fail(`Failed to get fleet depreciation summary: ${error}`)
    }
  }

  /**
   * Batch calculate depreciation for all equipment
   */
  async batchCalculateDepreciation(): Promise<Result<DepreciationCalculationDTO[]>> {
    try {
      const allEquipment = await this.equipmentRepo.findAll()
      const calculations: DepreciationCalculationDTO[] = []

      for (const equipment of allEquipment) {
        const calculation = this.computeDepreciation(equipment, new Date())
        calculations.push(calculation)

        // Update equipment current value
        const newValue = Money.create(calculation.bookValue, 'USD')
        if (newValue.isSuccess) {
          equipment.updateValue(newValue.value!)
          await this.equipmentRepo.save(equipment)
        }
      }

      return Result.ok(calculations)
    } catch (error) {
      return Result.fail(`Failed to batch calculate depreciation: ${error}`)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private computeDepreciation(equipment: Equipment, asOfDate: Date): DepreciationCalculationDTO {
    const acquisitionCost = equipment.acquisitionCost.amount
    const salvageValue = 0 // TODO: Get from equipment if available
    const currentAge = this.getYearsSinceAcquisition(equipment, asOfDate)

    let annualDepreciation = 0
    let accumulatedDepreciation = 0
    let depreciationRate = 0

    switch (equipment.depreciationMethod) {
      case 'STRAIGHT_LINE':
        {
          const depreciableAmount = acquisitionCost - salvageValue
          annualDepreciation = depreciableAmount / this.DEFAULT_USEFUL_LIFE_YEARS
          accumulatedDepreciation = Math.min(annualDepreciation * currentAge, depreciableAmount)
          depreciationRate = 1 / this.DEFAULT_USEFUL_LIFE_YEARS
        }
        break

      case 'DECLINING_BALANCE':
        {
          // Double declining balance method
          depreciationRate = 2 / this.DEFAULT_USEFUL_LIFE_YEARS
          let bookValue = acquisitionCost
          for (let year = 0; year < Math.floor(currentAge); year++) {
            const yearlyDepreciation = bookValue * depreciationRate
            accumulatedDepreciation += yearlyDepreciation
            bookValue -= yearlyDepreciation
          }
          annualDepreciation = (acquisitionCost - accumulatedDepreciation) * depreciationRate
        }
        break

      case 'USAGE_BASED':
        {
          // Based on operating hours
          const totalExpectedHours = this.DEFAULT_USEFUL_LIFE_YEARS * 2000 // Assume 2000 hours/year
          const actualHours = equipment.totalOperatingHours.hours
          const depreciableAmount = acquisitionCost - salvageValue
          accumulatedDepreciation = Math.min(
            (actualHours / totalExpectedHours) * depreciableAmount,
            depreciableAmount,
          )
          depreciationRate = 1 / totalExpectedHours
          annualDepreciation = 2000 * depreciationRate * depreciableAmount // Assume 2000 hours/year
        }
        break

      case 'SUM_OF_YEARS':
        {
          const sumOfYears = (this.DEFAULT_USEFUL_LIFE_YEARS * (this.DEFAULT_USEFUL_LIFE_YEARS + 1)) / 2
          const depreciableAmount = acquisitionCost - salvageValue
          for (let year = 1; year <= Math.floor(currentAge); year++) {
            const remainingLife = this.DEFAULT_USEFUL_LIFE_YEARS - year + 1
            const yearlyDepreciation = (remainingLife / sumOfYears) * depreciableAmount
            accumulatedDepreciation += yearlyDepreciation
          }
          const remainingLife = Math.max(
            this.DEFAULT_USEFUL_LIFE_YEARS - Math.floor(currentAge),
            1,
          )
          annualDepreciation = (remainingLife / sumOfYears) * depreciableAmount
          depreciationRate = remainingLife / sumOfYears / this.DEFAULT_USEFUL_LIFE_YEARS
        }
        break
    }

    const bookValue = Math.max(acquisitionCost - accumulatedDepreciation, salvageValue)

    return {
      equipmentId: equipment.id.toString(),
      assetNumber: equipment.assetNumber.value,
      method: equipment.depreciationMethod,
      acquisitionCost,
      salvageValue,
      usefulLifeYears: this.DEFAULT_USEFUL_LIFE_YEARS,
      currentAge,
      annualDepreciation,
      accumulatedDepreciation,
      bookValue,
      depreciationRate,
      calculatedAt: asOfDate,
    }
  }

  private getYearsSinceAcquisition(equipment: Equipment, asOfDate: Date): number {
    const diffMs = asOfDate.getTime() - equipment.acquisitionDate.getTime()
    return diffMs / (1000 * 60 * 60 * 24 * 365.25)
  }

  private getMonthsSinceAcquisition(equipment: Equipment): number {
    const diffMs = new Date().getTime() - equipment.acquisitionDate.getTime()
    return Math.max(diffMs / (1000 * 60 * 60 * 24 * 30), 1)
  }
}
