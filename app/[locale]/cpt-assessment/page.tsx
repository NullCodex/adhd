'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

interface TrialResult {
  letter: string;
  isTarget: boolean;
  responded: boolean;
  responseTime?: number;
  delay: number; // ISI (Inter-Stimulus Interval)
  timestamp: number;
  block: number; // Block number (0-5)
  subBlock: number; // Sub-block number within block (0-2)
  trialNumber: number; // Overall trial number (1-360)
}

interface CPTMetrics {
  // Basic stats
  totalTrials: number;
  targets: number;
  nonTargets: number;
  
  // Errors
  omissionErrors: number; // Failing to respond to target
  commissionErrors: number; // Responding to non-target
  perseverations: number; // RT < 100ms
  
  // Response times
  hitReactionTime: number; // Average RT for correct target responses
  hitReactionTimeSD: number; // Standard deviation of hit RT
  hitReactionTimeByISI: { [key: number]: { mean: number; count: number } };
  
  // Response style (speed vs accuracy)
  responseStyle: string;
  
  // Detectability (d-prime like measure)
  detectability: number;
  
  // Variability (change in consistency over time)
  variability: number;
  
  // Block analysis
  hitReactionTimeByBlock: { [key: number]: { mean: number; count: number } };
  omissionsByBlock: { [key: number]: { count: number; total: number; rate: number } };
  commissionsByBlock: { [key: number]: { count: number; total: number; rate: number } };
  
  // ISI analysis
  omissionsByISI: { [key: number]: { count: number; total: number; rate: number } };
  commissionsByISI: { [key: number]: { count: number; total: number; rate: number } };
  
  // Hit RT block change (change over time)
  hitReactionTimeBlockChange: number;
}

// CPT-3 Specifications
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TARGET_LETTER = 'X';
const TRIAL_DURATION_MS = 250; // Letter appears for 250ms
const DELAYS = [1000, 2000, 4000]; // Variable ISIs: 1s, 2s, or 4s delays (ISI)
const TOTAL_DURATION_MS = 14 * 60 * 1000; // 14 minutes (CPT-3 standard)
const TOTAL_TRIALS = 360; // CPT-3: 360 trials total
const NUM_BLOCKS = 6; // CPT-3: 6 blocks
const TRIALS_PER_BLOCK = 60; // CPT-3: 60 trials per block (3 sub-blocks × 20 trials)
const TRIALS_PER_SUB_BLOCK = 20; // CPT-3: 20 trials per sub-block
const NUM_SUB_BLOCKS_PER_BLOCK = 3; // CPT-3: 3 sub-blocks per block
const PERSEVERATION_THRESHOLD = 100; // RT < 100ms is a perseveration

export default function CPTAssessmentPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('cpt');
  const tCommon = useTranslations('common');
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_DURATION_MS);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [currentTrial, setCurrentTrial] = useState<TrialResult | null>(null);
  const [showLetter, setShowLetter] = useState(false);
  const [metrics, setMetrics] = useState<CPTMetrics | null>(null);
  const [currentTrialNumber, setCurrentTrialNumber] = useState<number>(0);

  const startTimeRef = useRef<number | null>(null);
  const letterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trialStartTimeRef = useRef<number | null>(null);
  const trialNumberRef = useRef<number>(0); // Track current trial number for CPT-3
  const previousTrialRef = useRef<TrialResult | null>(null);
  const currentTrialRef = useRef<TrialResult | null>(null);

  const getRandomLetter = useCallback(() => {
    // 20% chance of showing X (non-target), 80% chance of other letters (targets)
    if (Math.random() < 0.2) {
      return TARGET_LETTER;
    }
    const otherLetters = LETTERS.split('').filter(l => l !== TARGET_LETTER);
    return otherLetters[Math.floor(Math.random() * otherLetters.length)];
  }, []);

  const getRandomDelay = useCallback(() => {
    return DELAYS[Math.floor(Math.random() * DELAYS.length)];
  }, []);

  const getBlockNumber = useCallback((trialNumber: number): { block: number; subBlock: number } => {
    // CPT-3: 6 blocks, each with 3 sub-blocks of 20 trials
    const block = Math.min(Math.floor((trialNumber - 1) / TRIALS_PER_BLOCK), NUM_BLOCKS - 1);
    const trialsInCurrentBlock = ((trialNumber - 1) % TRIALS_PER_BLOCK) + 1;
    const subBlock = Math.min(Math.floor((trialsInCurrentBlock - 1) / TRIALS_PER_SUB_BLOCK), NUM_SUB_BLOCKS_PER_BLOCK - 1);
    return { block, subBlock };
  }, []);

  const calculateMetrics = useCallback((trials: TrialResult[]): CPTMetrics => {
    // Filter out any null or undefined trials
    const validTrials = trials.filter(t => t != null);
    const targets = validTrials.filter(t => t.isTarget);
    const nonTargets = validTrials.filter(t => !t.isTarget);
    
    // Omission errors (failing to respond to target)
    const omissionErrors = targets.filter(t => !t.responded).length;
    
    // Commission errors (responding to non-target)
    const commissionErrors = nonTargets.filter(t => t.responded).length;
    
    // Perseverations (RT < 100ms)
    const allResponses = trials.filter(t => t.responded && t.responseTime);
    const perseverations = allResponses.filter(t => (t.responseTime || 0) < PERSEVERATION_THRESHOLD).length;
    
    // Hit reaction time (correct responses to targets)
    const hitRTs = targets
      .filter(t => t.responded && t.responseTime && t.responseTime >= PERSEVERATION_THRESHOLD)
      .map(t => t.responseTime!);
    
    const hitReactionTime = hitRTs.length > 0
      ? hitRTs.reduce((a, b) => a + b, 0) / hitRTs.length
      : 0;
    
    // Hit RT standard deviation (requires at least 2 data points)
    const hitReactionTimeSD = hitRTs.length > 1
      ? Math.sqrt(hitRTs.reduce((sum, rt) => sum + Math.pow(rt - hitReactionTime, 2), 0) / hitRTs.length)
      : hitRTs.length === 1 ? -1 : 0; // Use -1 to indicate insufficient data (1 hit), 0 for no hits
    
    // Hit RT by ISI
    const hitRTByISI: { [key: number]: number[] } = {};
    targets
      .filter(t => t.responded && t.responseTime && t.responseTime >= PERSEVERATION_THRESHOLD)
      .forEach(t => {
        if (!hitRTByISI[t.delay]) hitRTByISI[t.delay] = [];
        hitRTByISI[t.delay].push(t.responseTime!);
      });
    
    const hitReactionTimeByISI: { [key: number]: { mean: number; count: number } } = {};
    DELAYS.forEach(isi => {
      if (hitRTByISI[isi] && hitRTByISI[isi].length > 0) {
        hitReactionTimeByISI[isi] = {
          mean: hitRTByISI[isi].reduce((a, b) => a + b, 0) / hitRTByISI[isi].length,
          count: hitRTByISI[isi].length,
        };
      } else {
        hitReactionTimeByISI[isi] = { mean: 0, count: 0 };
      }
    });
    
    // Response style (speed vs accuracy)
    const hitRate = targets.length > 0 ? (targets.filter(t => t.responded).length / targets.length) : 0;
    const falseAlarmRate = nonTargets.length > 0 ? (commissionErrors / nonTargets.length) : 0;
    let responseStyle = 'Balanced';
    if (hitRate > 0.9 && falseAlarmRate < 0.1) {
      responseStyle = 'Accurate';
    } else if (hitRate < 0.7 || falseAlarmRate > 0.3) {
      responseStyle = 'Fast/Impulsive';
    } else if (hitRate < 0.85) {
      responseStyle = 'Cautious';
    }
    
    // Detectability (simplified d-prime like measure)
    // Using hit rate and false alarm rate to calculate discriminability
    const detectability = targets.length > 0 && nonTargets.length > 0
      ? (hitRate - falseAlarmRate) * 100
      : 0;
    
    // Variability (coefficient of variation of hit RT) - requires at least 2 hits
    const variability = hitReactionTime > 0 && hitRTs.length > 1
      ? (hitReactionTimeSD / hitReactionTime) * 100
      : hitRTs.length === 1 ? -1 : 0; // Use -1 to indicate insufficient data (1 hit), 0 for no hits
    
    // Hit RT by block
    const hitRTByBlock: { [key: number]: number[] } = {};
    targets
      .filter(t => t.responded && t.responseTime && t.responseTime >= PERSEVERATION_THRESHOLD)
      .forEach(t => {
        if (!hitRTByBlock[t.block]) hitRTByBlock[t.block] = [];
        hitRTByBlock[t.block].push(t.responseTime!);
      });
    
    const hitReactionTimeByBlock: { [key: number]: { mean: number; count: number } } = {};
    for (let i = 0; i < NUM_BLOCKS; i++) {
      if (hitRTByBlock[i] && hitRTByBlock[i].length > 0) {
        hitReactionTimeByBlock[i] = {
          mean: hitRTByBlock[i].reduce((a, b) => a + b, 0) / hitRTByBlock[i].length,
          count: hitRTByBlock[i].length,
        };
      } else {
        hitReactionTimeByBlock[i] = { mean: 0, count: 0 };
      }
    }
    
    // Hit RT block change (linear trend)
    const blockMeans = Object.keys(hitReactionTimeByBlock)
      .map(Number)
      .sort((a, b) => a - b)
      .map(block => hitReactionTimeByBlock[block].mean)
      .filter(mean => mean > 0);
    
    let hitReactionTimeBlockChange = 0;
    if (blockMeans.length >= 2) {
      // Simple linear regression slope
      const n = blockMeans.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = blockMeans;
      const xMean = x.reduce((a, b) => a + b, 0) / n;
      const yMean = y.reduce((a, b) => a + b, 0) / n;
      const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
      const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
      hitReactionTimeBlockChange = denominator > 0 ? numerator / denominator : 0;
    }
    
    // Omissions by block
    const omissionsByBlock: { [key: number]: { count: number; total: number; rate: number } } = {};
    for (let i = 0; i < NUM_BLOCKS; i++) {
      const blockTargets = targets.filter(t => t.block === i);
      const blockOmissions = blockTargets.filter(t => !t.responded).length;
      omissionsByBlock[i] = {
        count: blockOmissions,
        total: blockTargets.length,
        rate: blockTargets.length > 0 ? (blockOmissions / blockTargets.length) * 100 : 0,
      };
    }
    
    // Commissions by block
    const commissionsByBlock: { [key: number]: { count: number; total: number; rate: number } } = {};
    for (let i = 0; i < NUM_BLOCKS; i++) {
      const blockNonTargets = nonTargets.filter(t => t.block === i);
      const blockCommissions = blockNonTargets.filter(t => t.responded).length;
      commissionsByBlock[i] = {
        count: blockCommissions,
        total: blockNonTargets.length,
        rate: blockNonTargets.length > 0 ? (blockCommissions / blockNonTargets.length) * 100 : 0,
      };
    }
    
    // Omissions by ISI
    const omissionsByISI: { [key: number]: { count: number; total: number; rate: number } } = {};
    DELAYS.forEach(isi => {
      const isiTargets = targets.filter(t => t.delay === isi);
      const isiOmissions = isiTargets.filter(t => !t.responded).length;
      omissionsByISI[isi] = {
        count: isiOmissions,
        total: isiTargets.length,
        rate: isiTargets.length > 0 ? (isiOmissions / isiTargets.length) * 100 : 0,
      };
    });
    
    // Commissions by ISI
    const commissionsByISI: { [key: number]: { count: number; total: number; rate: number } } = {};
    DELAYS.forEach(isi => {
      const isiNonTargets = nonTargets.filter(t => t.delay === isi);
      const isiCommissions = isiNonTargets.filter(t => t.responded).length;
      commissionsByISI[isi] = {
        count: isiCommissions,
        total: isiNonTargets.length,
        rate: isiNonTargets.length > 0 ? (isiCommissions / isiNonTargets.length) * 100 : 0,
      };
    });
    
    const metrics: CPTMetrics = {
      totalTrials: validTrials.length,
      targets: targets.length,
      nonTargets: nonTargets.length,
      omissionErrors,
      commissionErrors,
      perseverations,
      hitReactionTime: Math.round(hitReactionTime),
      hitReactionTimeSD: Math.round(hitReactionTimeSD),
      hitReactionTimeByISI,
      responseStyle,
      detectability: Math.round(detectability * 100) / 100,
      variability: Math.round(variability * 100) / 100,
      hitReactionTimeByBlock,
      omissionsByBlock,
      commissionsByBlock,
      omissionsByISI,
      commissionsByISI,
      hitReactionTimeBlockChange: Math.round(hitReactionTimeBlockChange * 100) / 100,
    };
    
    setMetrics(metrics);
    return metrics;
  }, []);

  // ADHD Interpretation based on CPT-3 metrics
  const interpretADHDIndicators = useCallback((metrics: CPTMetrics) => {
    const indicators: string[] = [];
    const concerns: string[] = [];
    let overallRisk = 'Low';
    let riskScore = 0;

    // Calculate error rates
    const omissionRate = metrics.targets > 0 ? (metrics.omissionErrors / metrics.targets) * 100 : 0;
    const commissionRate = metrics.nonTargets > 0 ? (metrics.commissionErrors / metrics.nonTargets) * 100 : 0;
    const perseverationRate = metrics.totalTrials > 0 ? (metrics.perseverations / metrics.totalTrials) * 100 : 0;

    // Omission errors (Inattention indicator)
    if (omissionRate > 15) {
      indicators.push('Elevated omission errors');
      concerns.push('High rate of missed targets suggests potential inattention');
      riskScore += 2;
    } else if (omissionRate > 10) {
      indicators.push('Moderate omission errors');
      concerns.push('Some missed targets may indicate attention difficulties');
      riskScore += 1;
    }

    // Commission errors (Impulsivity indicator)
    if (commissionRate > 20) {
      indicators.push('Elevated commission errors');
      concerns.push('High rate of false alarms suggests potential impulsivity');
      riskScore += 2;
    } else if (commissionRate > 10) {
      indicators.push('Moderate commission errors');
      concerns.push('Some false alarms may indicate impulse control difficulties');
      riskScore += 1;
    }

    // Reaction time variability (Consistency indicator)
    if (metrics.variability > 20) {
      indicators.push('High reaction time variability');
      concerns.push('Inconsistent reaction times may indicate attention regulation difficulties');
      riskScore += 2;
    } else if (metrics.variability > 15) {
      indicators.push('Moderate reaction time variability');
      concerns.push('Some variability in reaction times observed');
      riskScore += 1;
    }

    // Perseverations (Impulsivity indicator)
    if (perseverationRate > 2) {
      indicators.push('Elevated perseverations');
      concerns.push('Very fast responses (<100ms) suggest potential impulsivity');
      riskScore += 1;
    }

    // Performance decline over time
    if (metrics.hitReactionTimeBlockChange > 10) {
      indicators.push('Performance decline over time');
      concerns.push('Increasing reaction times across blocks may indicate sustained attention difficulties');
      riskScore += 1;
    }

    // Detectability (Discriminability)
    if (metrics.detectability < 30) {
      indicators.push('Reduced detectability');
      concerns.push('Lower ability to discriminate targets from non-targets');
      riskScore += 1;
    }

    // Determine overall risk level
    if (riskScore >= 6) {
      overallRisk = 'High';
    } else if (riskScore >= 3) {
      overallRisk = 'Moderate';
    }

    return {
      indicators,
      concerns,
      overallRisk,
      riskScore,
      omissionRate: Math.round(omissionRate * 10) / 10,
      commissionRate: Math.round(commissionRate * 10) / 10,
      variability: Math.round(metrics.variability * 10) / 10,
    };
  }, []);

  const startNextTrial = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    trialNumberRef.current += 1;
    const trialNumber = trialNumberRef.current;
    setCurrentTrialNumber(trialNumber);
    
    // CPT-3: Stop at exactly 360 trials or when time limit reached
    if (trialNumber > TOTAL_TRIALS || elapsed >= TOTAL_DURATION_MS) {
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

    const delay = getRandomDelay();
    const letter = getRandomLetter();
    const isTarget = letter !== TARGET_LETTER;
    const { block, subBlock } = getBlockNumber(trialNumber);

    const trial: TrialResult = {
      letter,
      isTarget,
      responded: false,
      delay,
      timestamp: Date.now(),
      block,
      subBlock,
      trialNumber,
    };

    // Store current trial in ref for recording when next stimulus appears
    previousTrialRef.current = currentTrialRef.current;
    currentTrialRef.current = trial;
    setCurrentTrial(trial);
    setShowLetter(false);
    // Clear trial start time to close response window for previous trial
    trialStartTimeRef.current = null;

    // For the first trial, show after a brief initial delay
    // For subsequent trials, show immediately since the ISI timing is already handled
    // by the remainingISI calculation in the previous trial
    const isFirstTrial = trialNumber === 1;
    const initialDelay = isFirstTrial ? 500 : 0; // 500ms initial delay for first trial, then immediate

    // Wait for the delay before showing the letter
    delayTimeoutRef.current = setTimeout(() => {
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

      const letterOnsetTime = Date.now();
      setCurrentLetter(letter);
      setShowLetter(true);
      trialStartTimeRef.current = letterOnsetTime;

      // Hide letter after 250ms (but keep trial active for responses)
      letterTimeoutRef.current = setTimeout(() => {
        setShowLetter(false);
        setCurrentLetter(null);
        // Don't record trial here - wait until next stimulus appears
        // Calculate remaining time until next stimulus onset (ISI from onset to onset)
        const timeSinceOnset = Date.now() - letterOnsetTime;
        // The remaining ISI is simply: delay - timeSinceOnset
        // This ensures the next stimulus appears exactly 'delay' ms after the current stimulus onset
        const remainingISI = Math.max(0, delay - timeSinceOnset);
        // Start next trial after remaining ISI time
        delayTimeoutRef.current = setTimeout(() => {
          startNextTrial();
        }, remainingISI);
      }, TRIAL_DURATION_MS);
    }, initialDelay);
  }, [getRandomDelay, getRandomLetter, getBlockNumber, calculateMetrics]);

  const handleResponse = useCallback(() => {
    // Allow responses up to the next stimulus (response window extends through ISI)
    if (!isStarted || !currentTrialRef.current || !trialStartTimeRef.current) {
      return;
    }

    const responseTime = Date.now() - trialStartTimeRef.current;
    
    // Maximum response window: up to the ISI duration for this trial
    // Responses after this are considered late/omission
    const maxResponseWindow = currentTrialRef.current.delay;
    if (responseTime > maxResponseWindow) {
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
  }, [isStarted]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handleResponse();
    }
  }, [handleResponse]);

  const startAssessment = () => {
    setIsStarted(true);
    startTimeRef.current = Date.now();
    trialNumberRef.current = 0; // Reset trial counter for CPT-3
    setCurrentTrialNumber(0);
    previousTrialRef.current = null;
    currentTrialRef.current = null;
    
    // Update timer every second
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, TOTAL_DURATION_MS - elapsed);
        setTimeRemaining(remaining);
        
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
    if (letterTimeoutRef.current) {
      clearTimeout(letterTimeoutRef.current);
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
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
      if (letterTimeoutRef.current) clearTimeout(letterTimeoutRef.current);
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
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
            {t('complete')}
          </h1>
          
          <div className="space-y-6">
            {/* Basic Statistics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('basicStats.title')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('basicStats.totalTrials')}</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalTrials}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('basicStats.targetLetters')}</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.targets}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('basicStats.nonTargetLetters')}</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.nonTargets}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('basicStats.correctResponses')}</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.targets - metrics.omissionErrors}</p>
                  <p className="text-xs text-gray-500">
                    {t('basicStats.accuracy', { percent: metrics.targets > 0 ? (((metrics.targets - metrics.omissionErrors) / metrics.targets) * 100).toFixed(1) : 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Analysis */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('errors.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('errors.omission')}</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.omissionErrors}</p>
                  <p className="text-xs text-gray-500">
                    {t('errors.omissionPercent', { percent: metrics.targets > 0 ? ((metrics.omissionErrors / metrics.targets) * 100).toFixed(1) : 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('errors.commission')}</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics.commissionErrors}</p>
                  <p className="text-xs text-gray-500">
                    {t('errors.commissionPercent', { percent: metrics.nonTargets > 0 ? ((metrics.commissionErrors / metrics.nonTargets) * 100).toFixed(1) : 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('errors.perseverations')}</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.perseverations}</p>
                  <p className="text-xs text-gray-500">{t('errors.rtNote')}</p>
                </div>
              </div>
            </div>

            {/* Response Time Metrics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('responseTime.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('responseTime.hitRT')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.hitReactionTime > 0 ? `${metrics.hitReactionTime}ms` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('responseTime.hitRTSD')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.hitReactionTimeSD > 0 ? `${Math.round(metrics.hitReactionTimeSD)}ms` : metrics.hitReactionTimeSD === -1 ? 'N/A*' : 'N/A'}
                  </p>
                  {metrics.hitReactionTimeSD === -1 && (
                    <p className="text-xs text-gray-500">{t('responseTime.requires2Hits')}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('responseTime.variability')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.variability > 0 ? `${metrics.variability.toFixed(1)}%` : metrics.variability === -1 ? 'N/A*' : 'N/A'}
                  </p>
                  {metrics.variability === -1 && (
                    <p className="text-xs text-gray-500">{t('responseTime.requires2Hits')}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('responseTime.responseStyle')}</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.responseStyle}</p>
                </div>
              </div>
            </div>

            {/* Detectability */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('detectability.title')}</h2>
              <p className="text-lg text-gray-700">
                {t('detectability.description', { value: metrics.detectability.toFixed(2) })}
              </p>
            </div>

            {/* Hit RT by ISI */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('hitRTByISI.title')}</h2>
              {metrics.targets - metrics.omissionErrors === 0 ? (
                <p className="text-gray-600 italic">{t('hitRTByISI.noResponses')}</p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {DELAYS.map(isi => (
                    <div key={isi} className="text-center">
                      <p className="text-sm text-gray-600">{t('hitRTByISI.isi', { value: isi })}</p>
                      <p className="text-xl font-bold text-gray-900">
                        {metrics.hitReactionTimeByISI[isi].mean > 0 
                          ? `${Math.round(metrics.hitReactionTimeByISI[isi].mean)}ms` 
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">(n={metrics.hitReactionTimeByISI[isi].count})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hit RT Block Change */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('hitRTBlockChange.title')}</h2>
              {metrics.targets - metrics.omissionErrors === 0 ? (
                <p className="text-gray-600 italic">{t('hitRTBlockChange.noResponses')}</p>
              ) : (
                <>
                  <p className="text-lg text-gray-700">
                    {t('hitRTBlockChange.change', { value: `${metrics.hitReactionTimeBlockChange > 0 ? '+' : ''}${metrics.hitReactionTimeBlockChange.toFixed(2)}` })}
                  </p>
                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {Array.from({ length: NUM_BLOCKS }, (_, i) => (
                      <div key={i} className="text-center">
                        <p className="text-xs text-gray-600">{t('hitRTBlockChange.block', { number: i + 1 })}</p>
                        <p className="text-sm font-bold text-gray-900">
                          {metrics.hitReactionTimeByBlock[i].mean > 0 
                            ? `${Math.round(metrics.hitReactionTimeByBlock[i].mean)}ms` 
                            : '-'}
                        </p>
                        {metrics.hitReactionTimeByBlock[i].count > 0 && (
                          <p className="text-xs text-gray-500">(n={metrics.hitReactionTimeByBlock[i].count})</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Omissions by Block */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('omissionsByBlock.title')}</h2>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: NUM_BLOCKS }, (_, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs text-gray-600">{t('omissionsByBlock.block', { number: i + 1 })}</p>
                    <p className="text-lg font-bold text-red-600">
                      {metrics.omissionsByBlock[i].rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      ({metrics.omissionsByBlock[i].count}/{metrics.omissionsByBlock[i].total})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Commissions by Block */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('commissionsByBlock.title')}</h2>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: NUM_BLOCKS }, (_, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs text-gray-600">{t('commissionsByBlock.block', { number: i + 1 })}</p>
                    <p className="text-lg font-bold text-orange-600">
                      {metrics.commissionsByBlock[i].rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      ({metrics.commissionsByBlock[i].count}/{metrics.commissionsByBlock[i].total})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Omissions by ISI */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('omissionsByISI.title')}</h2>
              <div className="grid grid-cols-3 gap-4">
                {DELAYS.map(isi => (
                  <div key={isi} className="text-center">
                    <p className="text-sm text-gray-600">{t('omissionsByISI.isi', { value: isi })}</p>
                    <p className="text-xl font-bold text-red-600">
                      {metrics.omissionsByISI[isi].rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      ({metrics.omissionsByISI[isi].count}/{metrics.omissionsByISI[isi].total})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Commissions by ISI */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('commissionsByISI.title')}</h2>
              <div className="grid grid-cols-3 gap-4">
                {DELAYS.map(isi => (
                  <div key={isi} className="text-center">
                    <p className="text-sm text-gray-600">{t('commissionsByISI.isi', { value: isi })}</p>
                    <p className="text-xl font-bold text-orange-600">
                      {metrics.commissionsByISI[isi].rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      ({metrics.commissionsByISI[isi].count}/{metrics.commissionsByISI[isi].total})
                    </p>
                  </div>
                ))}
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
                    {t('adhdAnalysis.title')}
                  </h2>
                  
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      {t('adhdAnalysis.disclaimer')}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-xl font-semibold text-gray-700">{t('adhdAnalysis.overallRisk')}</h3>
                      <span className={`px-4 py-2 rounded-lg font-bold text-lg ${
                        riskColor === 'red' ? 'bg-red-100 text-red-800' :
                        riskColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {adhdAnalysis.overallRisk}
                      </span>
                      <span className="text-sm text-gray-600">
                        {t('adhdAnalysis.riskScore', { score: adhdAnalysis.riskScore })}
                      </span>
                    </div>
                  </div>

                  {adhdAnalysis.indicators.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">{t('adhdAnalysis.indicators')}</h3>
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
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">{t('adhdAnalysis.concerns')}</h3>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('adhdAnalysis.omissionRate')}</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.omissionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.omissionRate > 15 ? t('adhdAnalysis.elevatedInattention') : 
                         adhdAnalysis.omissionRate > 10 ? t('adhdAnalysis.moderate') : t('adhdAnalysis.normal')}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('adhdAnalysis.commissionRate')}</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.commissionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.commissionRate > 20 ? t('adhdAnalysis.elevatedImpulsivity') : 
                         adhdAnalysis.commissionRate > 10 ? t('adhdAnalysis.moderate') : t('adhdAnalysis.normal')}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('adhdAnalysis.variability')}</p>
                      <p className="text-2xl font-bold text-gray-900">{adhdAnalysis.variability}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {adhdAnalysis.variability > 20 ? t('adhdAnalysis.highInconsistent') : 
                         adhdAnalysis.variability > 15 ? t('adhdAnalysis.moderate') : t('adhdAnalysis.normal')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {t('adhdAnalysis.nextSteps')}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {tCommon('backToHome')}
            </button>
            <button
              onClick={() => {
                setResults([]);
                setMetrics(null);
                setIsFinished(false);
                setTimeRemaining(TOTAL_DURATION_MS);
                trialNumberRef.current = 0; // Reset trial counter for CPT-3
                setCurrentTrialNumber(0);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tCommon('retakeAssessment')}
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
            {t('title')}
          </h1>
          
          <div className="space-y-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">{t('instructions.title')}</h2>
              <ul className="space-y-2 text-gray-700">
                {(t.raw('instructions.items') as string[]).map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                {t('instructions.tip')}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="flex-1 px-6 py-4 bg-gray-600 text-white rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
            >
              {tCommon('backToHome')}
            </button>
            <button
              onClick={startAssessment}
              className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              {t('start')}
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
          <p className="text-sm text-gray-600">{t('timeRemaining')}</p>
          <p className="text-2xl font-bold text-gray-900">{formatTime(timeRemaining)}</p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-lg shadow">
          <p className="text-sm text-gray-600">{t('trials')}</p>
          <p className="text-2xl font-bold text-gray-900">
            {t('currentTrial', { current: currentTrialNumber, total: TOTAL_TRIALS })}
          </p>
        </div>
      </div>

      {/* Letter Display */}
      <div className="flex-1 flex items-center justify-center">
        {showLetter && currentLetter ? (
          <div
            onClick={handleResponse}
            className="cursor-pointer select-none"
          >
            <div className="text-9xl font-bold text-black">
              {currentLetter}
            </div>
          </div>
        ) : (
          <div className="text-6xl font-light text-gray-300 select-none">
            +
          </div>
        )}
      </div>

      {/* Instructions Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-blue-50 border border-blue-200 px-6 py-3 rounded-lg text-center">
          <p className="text-sm text-blue-800">
            <strong>{t('pressForNonX')}</strong>
          </p>
        </div>
      </div>
    </main>
  );
}

