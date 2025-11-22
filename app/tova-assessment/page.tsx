'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TrialResult {
  stimulus: 'small' | 'large';
  isTarget: boolean;
  responded: boolean;
  responseTime?: number;
  timestamp: number;
  half: number; // 1 or 2
  trialNumber: number;
}

interface TOVAMetrics {
  // Basic stats
  totalTrials: number;
  half1Trials: number;
  half2Trials: number;
  
  // Half 1 (Infrequent Target) - respond to small square
  half1Targets: number;
  half1NonTargets: number;
  half1OmissionErrors: number;
  half1CommissionErrors: number;
  half1HitReactionTime: number;
  half1HitReactionTimeSD: number;
  half1Variability: number; // Coefficient of variation
  
  // Half 2 (Frequent Target) - respond to large square
  half2Targets: number;
  half2NonTargets: number;
  half2OmissionErrors: number;
  half2CommissionErrors: number;
  half2HitReactionTime: number;
  half2HitReactionTimeSD: number;
  half2Variability: number;
  
  // Overall metrics
  overallHitReactionTime: number;
  overallVariability: number;
  overallOmissionErrors: number;
  overallCommissionErrors: number;
  
  // D-prime (discriminability)
  dPrimeHalf1: number;
  dPrimeHalf2: number;
  dPrimeOverall: number;
  
  // Response time to correct responses
  responseTimeToCorrect: number;
  
  // Anticipatory responses (RT < 100ms)
  anticipatoryResponses: number;
}

// TOVA Specifications
const STIMULUS_DURATION_MS = 100; // Stimulus appears for 100ms
const ISI_MS = 2000; // Fixed 2-second inter-stimulus interval
const HALF_DURATION_MS = 10.8 * 60 * 1000; // 10.8 minutes per half
const TOTAL_DURATION_MS = 21.6 * 60 * 1000; // 21.6 minutes total
const ANTICIPATORY_THRESHOLD = 100; // RT < 100ms is anticipatory
const TARGET_PROBABILITY_HALF1 = 0.225; // 22.5% small squares (targets) in first half
const TARGET_PROBABILITY_HALF2 = 0.775; // 77.5% large squares (targets) in second half

// Helper function to calculate d-prime
const calculateDPrime = (hitRate: number, falseAlarmRate: number): number => {
  // Using z-scores approximation
  // d' = Z(hit rate) - Z(false alarm rate)
  // For edge cases, use correction
  const hitRateAdj = Math.max(0.01, Math.min(0.99, hitRate));
  const falseAlarmRateAdj = Math.max(0.01, Math.min(0.99, falseAlarmRate));
  
  // Z-score approximation using inverse normal CDF approximation
  const zHit = Math.sqrt(2) * inverseErf(2 * hitRateAdj - 1);
  const zFalseAlarm = Math.sqrt(2) * inverseErf(2 * falseAlarmRateAdj - 1);
  
  return zHit - zFalseAlarm;
};

// Approximation of inverse error function
const inverseErf = (x: number): number => {
  // Winitzki approximation
  const a = 0.147;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const ln = Math.log(1 - x * x);
  const sqrt = Math.sqrt((2 / (Math.PI * a)) + ln / 2);
  return sign * Math.sqrt(sqrt - ln / 2);
};

export default function TOVAAssessmentPage() {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentStimulus, setCurrentStimulus] = useState<'small' | 'large' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_DURATION_MS);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [currentTrial, setCurrentTrial] = useState<TrialResult | null>(null);
  const [showStimulus, setShowStimulus] = useState(false);
  const [metrics, setMetrics] = useState<TOVAMetrics | null>(null);
  const [currentTrialNumber, setCurrentTrialNumber] = useState<number>(0);
  const [currentHalf, setCurrentHalf] = useState<number>(1);

  const startTimeRef = useRef<number | null>(null);
  const stimulusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trialStartTimeRef = useRef<number | null>(null);
  const trialNumberRef = useRef<number>(0);
  const previousTrialRef = useRef<TrialResult | null>(null);
  const currentTrialRef = useRef<TrialResult | null>(null);

  const getRandomStimulus = useCallback((half: number): 'small' | 'large' => {
    // Half 1: 22.5% small (target), 77.5% large (non-target)
    // Half 2: 77.5% large (target), 22.5% small (non-target)
    const prob = half === 1 ? TARGET_PROBABILITY_HALF1 : TARGET_PROBABILITY_HALF2;
    return Math.random() < prob ? (half === 1 ? 'small' : 'large') : (half === 1 ? 'large' : 'small');
  }, []);

  const calculateMetrics = useCallback((trials: TrialResult[]): TOVAMetrics => {
    // Filter out any null or undefined trials
    const validTrials = trials.filter(t => t != null);
    const half1Trials = validTrials.filter(t => t.half === 1);
    const half2Trials = validTrials.filter(t => t.half === 2);
    
    // Half 1 Analysis (Infrequent Target - small square is target)
    const half1Targets = half1Trials.filter(t => t.isTarget);
    const half1NonTargets = half1Trials.filter(t => !t.isTarget);
    const half1OmissionErrors = half1Targets.filter(t => !t.responded).length;
    const half1CommissionErrors = half1NonTargets.filter(t => t.responded).length;
    
    const half1HitRTs = half1Targets
      .filter(t => t.responded && t.responseTime && t.responseTime >= ANTICIPATORY_THRESHOLD)
      .map(t => t.responseTime!);
    
    const half1HitReactionTime = half1HitRTs.length > 0
      ? half1HitRTs.reduce((a, b) => a + b, 0) / half1HitRTs.length
      : 0;
    
    const half1HitReactionTimeSD = half1HitRTs.length > 1
      ? Math.sqrt(half1HitRTs.reduce((sum, rt) => sum + Math.pow(rt - half1HitReactionTime, 2), 0) / half1HitRTs.length)
      : 0;
    
    const half1Variability = half1HitReactionTime > 0
      ? (half1HitReactionTimeSD / half1HitReactionTime) * 100
      : 0;
    
    const half1HitRate = half1Targets.length > 0 ? (half1Targets.filter(t => t.responded).length / half1Targets.length) : 0;
    const half1FalseAlarmRate = half1NonTargets.length > 0 ? (half1CommissionErrors / half1NonTargets.length) : 0;
    const dPrimeHalf1 = calculateDPrime(half1HitRate, half1FalseAlarmRate);
    
    // Half 2 Analysis (Frequent Target - large square is target)
    const half2Targets = half2Trials.filter(t => t.isTarget);
    const half2NonTargets = half2Trials.filter(t => !t.isTarget);
    const half2OmissionErrors = half2Targets.filter(t => !t.responded).length;
    const half2CommissionErrors = half2NonTargets.filter(t => t.responded).length;
    
    const half2HitRTs = half2Targets
      .filter(t => t.responded && t.responseTime && t.responseTime >= ANTICIPATORY_THRESHOLD)
      .map(t => t.responseTime!);
    
    const half2HitReactionTime = half2HitRTs.length > 0
      ? half2HitRTs.reduce((a, b) => a + b, 0) / half2HitRTs.length
      : 0;
    
    const half2HitReactionTimeSD = half2HitRTs.length > 1
      ? Math.sqrt(half2HitRTs.reduce((sum, rt) => sum + Math.pow(rt - half2HitReactionTime, 2), 0) / half2HitRTs.length)
      : 0;
    
    const half2Variability = half2HitReactionTime > 0
      ? (half2HitReactionTimeSD / half2HitReactionTime) * 100
      : 0;
    
    const half2HitRate = half2Targets.length > 0 ? (half2Targets.filter(t => t.responded).length / half2Targets.length) : 0;
    const half2FalseAlarmRate = half2NonTargets.length > 0 ? (half2CommissionErrors / half2NonTargets.length) : 0;
    const dPrimeHalf2 = calculateDPrime(half2HitRate, half2FalseAlarmRate);
    
    // Overall Analysis
    const allTargets = trials.filter(t => t.isTarget);
    const allNonTargets = trials.filter(t => !t.isTarget);
    const overallOmissionErrors = allTargets.filter(t => !t.responded).length;
    const overallCommissionErrors = allNonTargets.filter(t => t.responded).length;
    
    const allHitRTs = allTargets
      .filter(t => t.responded && t.responseTime && t.responseTime >= ANTICIPATORY_THRESHOLD)
      .map(t => t.responseTime!);
    
    const overallHitReactionTime = allHitRTs.length > 0
      ? allHitRTs.reduce((a, b) => a + b, 0) / allHitRTs.length
      : 0;
    
    const overallHitReactionTimeSD = allHitRTs.length > 1
      ? Math.sqrt(allHitRTs.reduce((sum, rt) => sum + Math.pow(rt - overallHitReactionTime, 2), 0) / allHitRTs.length)
      : 0;
    
    const overallVariability = overallHitReactionTime > 0
      ? (overallHitReactionTimeSD / overallHitReactionTime) * 100
      : 0;
    
    const overallHitRate = allTargets.length > 0 ? (allTargets.filter(t => t.responded).length / allTargets.length) : 0;
    const overallFalseAlarmRate = allNonTargets.length > 0 ? (overallCommissionErrors / allNonTargets.length) : 0;
    const dPrimeOverall = calculateDPrime(overallHitRate, overallFalseAlarmRate);
    
    // Response time to correct responses (same as overall hit RT)
    const responseTimeToCorrect = overallHitReactionTime;
    
    // Anticipatory responses
    const anticipatoryResponses = trials.filter(t => 
      t.responded && t.responseTime && t.responseTime < ANTICIPATORY_THRESHOLD
    ).length;
    
    const metrics: TOVAMetrics = {
      totalTrials: validTrials.length,
      half1Trials: half1Trials.length,
      half2Trials: half2Trials.length,
      half1Targets: half1Targets.length,
      half1NonTargets: half1NonTargets.length,
      half1OmissionErrors,
      half1CommissionErrors,
      half1HitReactionTime: Math.round(half1HitReactionTime),
      half1HitReactionTimeSD: Math.round(half1HitReactionTimeSD),
      half1Variability: Math.round(half1Variability * 100) / 100,
      half2Targets: half2Targets.length,
      half2NonTargets: half2NonTargets.length,
      half2OmissionErrors,
      half2CommissionErrors,
      half2HitReactionTime: Math.round(half2HitReactionTime),
      half2HitReactionTimeSD: Math.round(half2HitReactionTimeSD),
      half2Variability: Math.round(half2Variability * 100) / 100,
      overallHitReactionTime: Math.round(overallHitReactionTime),
      overallVariability: Math.round(overallVariability * 100) / 100,
      overallOmissionErrors,
      overallCommissionErrors,
      dPrimeHalf1: Math.round(dPrimeHalf1 * 100) / 100,
      dPrimeHalf2: Math.round(dPrimeHalf2 * 100) / 100,
      dPrimeOverall: Math.round(dPrimeOverall * 100) / 100,
      responseTimeToCorrect: Math.round(responseTimeToCorrect),
      anticipatoryResponses,
    };
    
    setMetrics(metrics);
    return metrics;
  }, []);

  // ADHD Interpretation based on TOVA metrics
  const interpretADHDIndicators = useCallback((metrics: TOVAMetrics) => {
    const indicators: string[] = [];
    const concerns: string[] = [];
    let overallRisk = 'Low';
    let riskScore = 0;

    // Calculate error rates
    const overallOmissionRate = metrics.overallOmissionErrors > 0 && (metrics.half1Targets + metrics.half2Targets) > 0
      ? (metrics.overallOmissionErrors / (metrics.half1Targets + metrics.half2Targets)) * 100 : 0;
    const overallCommissionRate = metrics.overallCommissionErrors > 0 && (metrics.half1NonTargets + metrics.half2NonTargets) > 0
      ? (metrics.overallCommissionErrors / (metrics.half1NonTargets + metrics.half2NonTargets)) * 100 : 0;
    
    const half1OmissionRate = metrics.half1Targets > 0 ? (metrics.half1OmissionErrors / metrics.half1Targets) * 100 : 0;
    const half2CommissionRate = metrics.half2NonTargets > 0 ? (metrics.half2CommissionErrors / metrics.half2NonTargets) * 100 : 0;
    const anticipatoryRate = metrics.totalTrials > 0 ? (metrics.anticipatoryResponses / metrics.totalTrials) * 100 : 0;

    // Omission errors in Half 1 (Inattention - infrequent targets)
    if (half1OmissionRate > 20) {
      indicators.push('Elevated omission errors in infrequent target condition');
      concerns.push('High rate of missed targets when targets are rare suggests inattention');
      riskScore += 2;
    } else if (half1OmissionRate > 10) {
      indicators.push('Moderate omission errors in infrequent target condition');
      concerns.push('Some missed targets when targets are rare may indicate attention difficulties');
      riskScore += 1;
    }

    // Commission errors in Half 2 (Impulsivity - frequent targets)
    if (half2CommissionRate > 15) {
      indicators.push('Elevated commission errors in frequent target condition');
      concerns.push('High rate of false alarms when non-targets are rare suggests impulsivity');
      riskScore += 2;
    } else if (half2CommissionRate > 8) {
      indicators.push('Moderate commission errors in frequent target condition');
      concerns.push('Some false alarms when non-targets are rare may indicate impulse control difficulties');
      riskScore += 1;
    }

    // Overall omission errors
    if (overallOmissionRate > 15) {
      indicators.push('Elevated overall omission errors');
      concerns.push('Consistently missing targets suggests sustained attention difficulties');
      riskScore += 1;
    }

    // Overall commission errors
    if (overallCommissionRate > 12) {
      indicators.push('Elevated overall commission errors');
      concerns.push('Consistently responding to non-targets suggests impulse control difficulties');
      riskScore += 1;
    }

    // Reaction time variability
    if (metrics.overallVariability > 25) {
      indicators.push('High reaction time variability');
      concerns.push('Inconsistent reaction times may indicate attention regulation difficulties');
      riskScore += 2;
    } else if (metrics.overallVariability > 18) {
      indicators.push('Moderate reaction time variability');
      concerns.push('Some variability in reaction times observed');
      riskScore += 1;
    }

    // D-prime (discriminability)
    if (metrics.dPrimeOverall < 1.5) {
      indicators.push('Reduced discriminability (low d-prime)');
      concerns.push('Lower ability to discriminate targets from non-targets');
      riskScore += 1;
    }

    // Anticipatory responses (impulsivity)
    if (anticipatoryRate > 3) {
      indicators.push('Elevated anticipatory responses');
      concerns.push('Very fast responses (<100ms) suggest potential impulsivity');
      riskScore += 1;
    }

    // Performance difference between halves
    const half1HitRate = metrics.half1Targets > 0 ? ((metrics.half1Targets - metrics.half1OmissionErrors) / metrics.half1Targets) * 100 : 0;
    const half2HitRate = metrics.half2Targets > 0 ? ((metrics.half2Targets - metrics.half2OmissionErrors) / metrics.half2Targets) * 100 : 0;
    const hitRateDifference = Math.abs(half1HitRate - half2HitRate);
    
    if (hitRateDifference > 20) {
      indicators.push('Significant performance difference between halves');
      concerns.push('Large difference in performance between infrequent and frequent target conditions');
      riskScore += 1;
    }

    // Determine overall risk level
    if (riskScore >= 7) {
      overallRisk = 'High';
    } else if (riskScore >= 4) {
      overallRisk = 'Moderate';
    }

    return {
      indicators,
      concerns,
      overallRisk,
      riskScore,
      overallOmissionRate: Math.round(overallOmissionRate * 10) / 10,
      overallCommissionRate: Math.round(overallCommissionRate * 10) / 10,
      half1OmissionRate: Math.round(half1OmissionRate * 10) / 10,
      half2CommissionRate: Math.round(half2CommissionRate * 10) / 10,
      variability: Math.round(metrics.overallVariability * 10) / 10,
      dPrime: Math.round(metrics.dPrimeOverall * 100) / 100,
    };
  }, []);

  const startNextTrial = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    
    // Determine which half we're in
    const half = elapsed < HALF_DURATION_MS ? 1 : 2;
    setCurrentHalf(half);
    
    // Stop if time limit reached
    if (elapsed >= TOTAL_DURATION_MS) {
      // Record final trial before finishing
      if (previousTrialRef.current) {
        const previousTrial = previousTrialRef.current;
        setResults(prev => {
          const updated = [...prev, previousTrial];
          // Filter out any null values before calculating metrics
          const validUpdated = updated.filter(t => t != null);
          calculateMetrics(validUpdated);
          return updated;
        });
      }
      finishAssessment();
      return;
    }

    trialNumberRef.current += 1;
    const trialNumber = trialNumberRef.current;
    setCurrentTrialNumber(trialNumber);

    const stimulus = getRandomStimulus(half);
    // In half 1: small is target, large is non-target
    // In half 2: large is target, small is non-target
    const isTarget = (half === 1 && stimulus === 'small') || (half === 2 && stimulus === 'large');

    const trial: TrialResult = {
      stimulus,
      isTarget,
      responded: false,
      timestamp: Date.now(),
      half,
      trialNumber,
    };

    // Store current trial in ref for recording when next stimulus appears
    previousTrialRef.current = currentTrialRef.current;
    currentTrialRef.current = trial;
    setCurrentTrial(trial);
    setShowStimulus(false);
    // Clear trial start time to close response window for previous trial
    trialStartTimeRef.current = null;

    // For the first trial, show after a brief initial delay
    // For subsequent trials, show immediately since the ISI timing is already handled
    // by the remainingISI calculation in the previous trial
    const isFirstTrial = trialNumber === 1;
    const initialDelay = isFirstTrial ? 500 : 0; // 500ms initial delay for first trial, then immediate

    // Wait for ISI before showing stimulus (ISI is from onset to onset)
    isiTimeoutRef.current = setTimeout(() => {
      if (!startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= TOTAL_DURATION_MS) {
        finishAssessment();
        return;
      }

      // Record the previous trial result before starting new stimulus
      // (response window extends until next stimulus appears)
      if (previousTrialRef.current) {
        const previousTrial = previousTrialRef.current;
        setResults(prev => {
          const updated = [...prev, previousTrial];
          // Filter out any null values before calculating metrics
          const validUpdated = updated.filter(t => t != null);
          calculateMetrics(validUpdated);
          return updated;
        });
        previousTrialRef.current = null;
      }

      const stimulusOnsetTime = Date.now();
      setCurrentStimulus(stimulus);
      setShowStimulus(true);
      trialStartTimeRef.current = stimulusOnsetTime;

      // Hide stimulus after 100ms (but keep trial active for responses)
      stimulusTimeoutRef.current = setTimeout(() => {
        setShowStimulus(false);
        setCurrentStimulus(null);
        // Don't record trial here - wait until next stimulus appears
        // Calculate remaining time until next stimulus onset (ISI from onset to onset)
        const timeSinceOnset = Date.now() - stimulusOnsetTime;
        // The remaining ISI is simply: ISI_MS - timeSinceOnset
        // This ensures the next stimulus appears exactly 'ISI_MS' ms after the current stimulus onset
        const remainingISI = Math.max(0, ISI_MS - timeSinceOnset);
        // Start next trial after remaining ISI time
        isiTimeoutRef.current = setTimeout(() => {
          startNextTrial();
        }, remainingISI);
      }, STIMULUS_DURATION_MS);
    }, initialDelay);
  }, [getRandomStimulus, calculateMetrics]);

  const handleResponse = useCallback(() => {
    // Allow responses up to the next stimulus (response window extends through ISI)
    if (!isStarted || !currentTrialRef.current || !trialStartTimeRef.current) {
      return;
    }

    const responseTime = Date.now() - trialStartTimeRef.current;
    
    // Maximum response window: up to ISI duration (2000ms for TOVA)
    // Responses after this are considered late/omission
    if (responseTime > ISI_MS) {
      return;
    }
    
    if (!currentTrialRef.current.responded) {
      const updatedTrial = {
        ...currentTrialRef.current,
        responded: true,
        responseTime,
      };

      currentTrialRef.current = updatedTrial;
      setCurrentTrial(updatedTrial);
      
      // Update the result in the results array
      // Note: The trial might not be in the array yet (it's added when next stimulus appears)
      // So we update the ref, and the actual array will be updated when the next trial starts
      setResults(prev => {
        const updated = [...prev];
        // Find the trial in the array by trialNumber, or add it if not found
        const trialIndex = updated.findIndex(t => t && t.trialNumber === updatedTrial.trialNumber);
        if (trialIndex >= 0) {
          updated[trialIndex] = updatedTrial;
        } else {
          // Trial not in array yet, add it
          updated.push(updatedTrial);
        }
        // Filter out any null values before calculating metrics
        const validUpdated = updated.filter(t => t != null);
        calculateMetrics(validUpdated);
        return updated;
      });
    }
  }, [isStarted, calculateMetrics]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handleResponse();
    }
  }, [handleResponse]);

  const startAssessment = () => {
    setIsStarted(true);
    startTimeRef.current = Date.now();
    trialNumberRef.current = 0;
    setCurrentTrialNumber(0);
    setCurrentHalf(1);
    previousTrialRef.current = null;
    currentTrialRef.current = null;
    
    // Update timer every 100ms
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, TOTAL_DURATION_MS - elapsed);
        setTimeRemaining(remaining);
        
        // Update half indicator
        const half = elapsed < HALF_DURATION_MS ? 1 : 2;
        setCurrentHalf(half);
        
        if (remaining === 0) {
          finishAssessment();
        }
      }
    }, 100);

    startNextTrial();
  };

  const finishAssessment = () => {
    setIsStarted(false);
    setIsFinished(true);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (stimulusTimeoutRef.current) {
      clearTimeout(stimulusTimeoutRef.current);
    }
    if (isiTimeoutRef.current) {
      clearTimeout(isiTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (isStarted) {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isStarted, handleKeyPress]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);
      if (isiTimeoutRef.current) clearTimeout(isiTimeoutRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isFinished && metrics) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
            TOVA Assessment Complete - Detailed Results
          </h1>
          
          <div className="space-y-6">
            {/* Basic Statistics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Basic Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Trials</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalTrials}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Half 1 Trials</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.half1Trials}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Half 2 Trials</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.half2Trials}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Anticipatory Responses</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.anticipatoryResponses}</p>
                </div>
              </div>
            </div>

            {/* Half 1 Results (Infrequent Target) */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Half 1: Infrequent Target (Small Square = Target)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Targets (Small)</p>
                  <p className="text-xl font-bold text-blue-600">{metrics.half1Targets}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Non-Targets (Large)</p>
                  <p className="text-xl font-bold text-purple-600">{metrics.half1NonTargets}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Omission Errors</p>
                  <p className="text-xl font-bold text-red-600">{metrics.half1OmissionErrors}</p>
                  <p className="text-xs text-gray-500">
                    ({metrics.half1Targets > 0 ? ((metrics.half1OmissionErrors / metrics.half1Targets) * 100).toFixed(1) : 0}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commission Errors</p>
                  <p className="text-xl font-bold text-orange-600">{metrics.half1CommissionErrors}</p>
                  <p className="text-xs text-gray-500">
                    ({metrics.half1NonTargets > 0 ? ((metrics.half1CommissionErrors / metrics.half1NonTargets) * 100).toFixed(1) : 0}%)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Hit Reaction Time</p>
                  <p className="text-xl font-bold text-gray-900">
                    {metrics.half1HitReactionTime > 0 ? `${metrics.half1HitReactionTime}ms` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hit RT SD</p>
                  <p className="text-xl font-bold text-gray-900">
                    {metrics.half1HitReactionTimeSD > 0 ? `${metrics.half1HitReactionTimeSD}ms` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Variability (CV%)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {metrics.half1Variability > 0 ? `${metrics.half1Variability.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">D-Prime</p>
                  <p className="text-xl font-bold text-blue-600">
                    {metrics.dPrimeHalf1.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Half 2 Results (Frequent Target) */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Half 2: Frequent Target (Large Square = Target)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Targets (Large)</p>
                  <p className="text-xl font-bold text-blue-600">{metrics.half2Targets}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Non-Targets (Small)</p>
                  <p className="text-xl font-bold text-purple-600">{metrics.half2NonTargets}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Omission Errors</p>
                  <p className="text-xl font-bold text-red-600">{metrics.half2OmissionErrors}</p>
                  <p className="text-xs text-gray-500">
                    ({metrics.half2Targets > 0 ? ((metrics.half2OmissionErrors / metrics.half2Targets) * 100).toFixed(1) : 0}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commission Errors</p>
                  <p className="text-xl font-bold text-orange-600">{metrics.half2CommissionErrors}</p>
                  <p className="text-xs text-gray-500">
                    ({metrics.half2NonTargets > 0 ? ((metrics.half2CommissionErrors / metrics.half2NonTargets) * 100).toFixed(1) : 0}%)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Hit Reaction Time</p>
                  <p className="text-xl font-bold text-gray-900">
                    {metrics.half2HitReactionTime > 0 ? `${metrics.half2HitReactionTime}ms` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hit RT SD</p>
                  <p className="text-xl font-bold text-gray-900">
                    {metrics.half2HitReactionTimeSD > 0 ? `${metrics.half2HitReactionTimeSD}ms` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Variability (CV%)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {metrics.half2Variability > 0 ? `${metrics.half2Variability.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">D-Prime</p>
                  <p className="text-xl font-bold text-blue-600">
                    {metrics.dPrimeHalf2.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Results */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Overall Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Overall Hit Reaction Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.overallHitReactionTime > 0 ? `${metrics.overallHitReactionTime}ms` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Variability (CV%)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.overallVariability > 0 ? `${metrics.overallVariability.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall D-Prime</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.dPrimeOverall.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Response Time to Correct</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.responseTimeToCorrect > 0 ? `${metrics.responseTimeToCorrect}ms` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Omission Errors</p>
                  <p className="text-xl font-bold text-red-600">{metrics.overallOmissionErrors}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Commission Errors</p>
                  <p className="text-xl font-bold text-orange-600">{metrics.overallCommissionErrors}</p>
                </div>
              </div>
            </div>

            {/* ADHD Interpretation */}
            {(() => {
              const adhdAnalysis = interpretADHDIndicators(metrics);
              const riskColor = adhdAnalysis.overallRisk === 'High' ? 'red' : 
                               adhdAnalysis.overallRisk === 'Moderate' ? 'orange' : 'green';
              
              return (
                <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    ADHD-Related Performance Analysis
                  </h2>
                  
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Important Disclaimer:</strong> This analysis is for informational purposes only and is not a diagnostic tool. 
                      ADHD diagnosis requires comprehensive clinical evaluation by a qualified healthcare professional. 
                      Test performance can be influenced by many factors including fatigue, anxiety, motivation, and other conditions.
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-xl font-semibold text-gray-700">Overall Risk Level:</h3>
                      <span className={`px-4 py-2 rounded-lg font-bold text-lg ${
                        riskColor === 'red' ? 'bg-red-100 text-red-800' :
                        riskColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {adhdAnalysis.overallRisk}
                      </span>
                      <span className="text-sm text-gray-600">
                        (Risk Score: {adhdAnalysis.riskScore}/9)
                      </span>
                    </div>
                  </div>

                  {adhdAnalysis.indicators.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">Identified Indicators:</h3>
                      <ul className="space-y-2">
                        {adhdAnalysis.indicators.map((indicator, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span className="text-gray-700">{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {adhdAnalysis.concerns.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">Performance Concerns:</h3>
                      <ul className="space-y-2">
                        {adhdAnalysis.concerns.map((concern, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            <span className="text-gray-700">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Overall Omission Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.overallOmissionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.overallOmissionRate > 15 ? 'Elevated (Inattention)' : 
                         adhdAnalysis.overallOmissionRate > 10 ? 'Moderate' : 'Normal'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Overall Commission Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.overallCommissionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.overallCommissionRate > 12 ? 'Elevated (Impulsivity)' : 
                         adhdAnalysis.overallCommissionRate > 8 ? 'Moderate' : 'Normal'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Half 1 Omission Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.half1OmissionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.half1OmissionRate > 20 ? 'Elevated (Infrequent targets)' : 
                         adhdAnalysis.half1OmissionRate > 10 ? 'Moderate' : 'Normal'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Half 2 Commission Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.half2CommissionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.half2CommissionRate > 15 ? 'Elevated (Frequent targets)' : 
                         adhdAnalysis.half2CommissionRate > 8 ? 'Moderate' : 'Normal'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Reaction Time Variability</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.variability}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.variability > 25 ? 'High (Inconsistent)' : 
                         adhdAnalysis.variability > 18 ? 'Moderate' : 'Normal'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">D-Prime (Discriminability)</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.dPrime.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.dPrime < 1.5 ? 'Reduced' : 
                         adhdAnalysis.dPrime < 2.0 ? 'Moderate' : 'Good'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Next Steps:</strong> If you have concerns about attention or impulse control, 
                      consider consulting with a healthcare professional who specializes in ADHD assessment. 
                      A comprehensive evaluation typically includes clinical interviews, behavioral observations, 
                      and may incorporate multiple assessment tools.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => {
                setResults([]);
                setMetrics(null);
                setIsFinished(false);
                setTimeRemaining(TOTAL_DURATION_MS);
                trialNumberRef.current = 0;
                setCurrentTrialNumber(0);
                setCurrentHalf(1);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!isStarted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
        <div className="max-w-2xl w-full bg-gray-50 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
            Test of Variables of Attention (TOVA)
          </h1>
          
          <div className="space-y-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Instructions</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>You will see two types of squares appear on the screen: <strong>small</strong> and <strong>large</strong>.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>First Half (10.8 minutes):</strong> Press SPACEBAR or CLICK when you see a <strong>SMALL</strong> square. Do NOT respond to large squares.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Second Half (10.8 minutes):</strong> Press SPACEBAR or CLICK when you see a <strong>LARGE</strong> square. Do NOT respond to small squares.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>The test will automatically switch to the second half after 10.8 minutes.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Total duration: <strong>21.6 minutes</strong>.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Respond as quickly and accurately as possible.</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Pay attention to the indicator showing which half you're in. The target changes between halves!
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-4 bg-gray-600 text-white rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Back to Home
            </button>
            <button
              onClick={startAssessment}
              className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start TOVA Test
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white relative">
      {/* Timer and Stats */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className="bg-gray-100 px-4 py-2 rounded-lg shadow">
          <p className="text-sm text-gray-600">Time Remaining</p>
          <p className="text-2xl font-bold text-gray-900">{formatTime(timeRemaining)}</p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-lg shadow">
          <p className="text-sm text-gray-600">Half</p>
          <p className="text-2xl font-bold text-blue-600">
            {currentHalf} / 2
          </p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-lg shadow">
          <p className="text-sm text-gray-600">Trials</p>
          <p className="text-2xl font-bold text-gray-900">
            {currentTrialNumber}
          </p>
        </div>
      </div>

      {/* Half Indicator */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
        <div className={`px-6 py-3 rounded-lg shadow-lg ${
          currentHalf === 1 ? 'bg-blue-100 border-2 border-blue-500' : 'bg-purple-100 border-2 border-purple-500'
        }`}>
          <p className={`text-lg font-bold text-center ${
            currentHalf === 1 ? 'text-blue-900' : 'text-purple-900'
          }`}>
            {currentHalf === 1 
              ? 'Half 1: Press for SMALL squares' 
              : 'Half 2: Press for LARGE squares'}
          </p>
        </div>
      </div>

      {/* Stimulus Display */}
      <div className="flex-1 flex items-center justify-center">
        {showStimulus && currentStimulus ? (
          <div
            onClick={handleResponse}
            className="cursor-pointer select-none"
          >
            <div className={`${currentStimulus === 'small' ? 'w-32 h-32' : 'w-64 h-64'} bg-black border-4 border-gray-800`}>
            </div>
          </div>
        ) : (
          <div className="w-64 h-64 flex items-center justify-center">
            <div className="text-6xl font-light text-gray-300 select-none">
              +
            </div>
          </div>
        )}
      </div>

      {/* Instructions Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-blue-50 border border-blue-200 px-6 py-3 rounded-lg text-center">
          <p className="text-sm text-blue-800">
            <strong>
              {currentHalf === 1 
                ? 'Press SPACEBAR or CLICK for SMALL squares' 
                : 'Press SPACEBAR or CLICK for LARGE squares'}
            </strong>
          </p>
        </div>
      </div>
    </main>
  );
}

