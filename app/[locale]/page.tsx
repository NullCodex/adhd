'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { SECTIONS, SCROLL_CONFIG, NAV_CONFIG, EXTERNAL_LINK_ATTRS, type SectionId } from '@/lib/constants';
import { throttle, isBrowser } from '@/lib/utils';
import { SkipLink } from '@/components/SkipLink';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const [activeSection, setActiveSection] = useState<SectionId | ''>('');
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);

  const handleScroll = useCallback(() => {
    // Don't update during programmatic scrolling
    if (isProgrammaticScroll || !isBrowser()) {
      return;
    }

    const scrollPosition = window.scrollY + SCROLL_CONFIG.SCROLL_DETECTION_OFFSET;

    // Check sections from bottom to top to prioritize later sections when at boundaries
    for (let i = SECTIONS.length - 1; i >= 0; i--) {
      const section = SECTIONS[i];
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = window.scrollY + rect.top;
        const elementBottom = elementTop + rect.height;
        
        // Check if scroll position is within this section
        if (scrollPosition >= elementTop && scrollPosition < elementBottom + SCROLL_CONFIG.BOUNDARY_TOLERANCE) {
          setActiveSection(section);
          break;
        }
      }
    }
  }, [isProgrammaticScroll]);

  // Throttle scroll handler for better performance
  const throttledHandleScroll = useMemo(
    () => throttle(handleScroll, 16), // ~60fps
    [handleScroll]
  );

  useEffect(() => {
    if (!isBrowser()) return;

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    handleScroll(); // Check on mount
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [throttledHandleScroll, handleScroll]);

  const scrollToSection = useCallback((id: SectionId) => {
    if (!isBrowser()) return;

    // Immediately set the active section when clicking
    setActiveSection(id);
    setIsProgrammaticScroll(true);
    
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - SCROLL_CONFIG.OFFSET;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Keep the target section active during scroll
      const checkInterval = setInterval(() => {
        setActiveSection(id);
      }, SCROLL_CONFIG.ACTIVE_CHECK_INTERVAL);

      // After scroll completes, re-enable scroll detection and verify
      setTimeout(() => {
        clearInterval(checkInterval);
        setIsProgrammaticScroll(false);
        // Force the correct section one more time
        setActiveSection(id);
        
        // Verify after a short delay
        setTimeout(() => {
          if (!isBrowser()) return;
          const scrollPosition = window.scrollY + SCROLL_CONFIG.SCROLL_DETECTION_OFFSET;
          const rect = element.getBoundingClientRect();
          const elementTop = window.scrollY + rect.top;
          const elementBottom = elementTop + rect.height;
          
          if (scrollPosition >= elementTop && scrollPosition < elementBottom + SCROLL_CONFIG.BOUNDARY_TOLERANCE) {
            setActiveSection(id);
          }
        }, SCROLL_CONFIG.VERIFICATION_DELAY);
      }, SCROLL_CONFIG.SCROLL_COMPLETE_DELAY);
    }
  }, []);

  const navigationItems = useMemo(() => [
    { id: 'what-is-adhd' as SectionId, label: t('nav.whatIsAdhd') },
    { id: 'statistics' as SectionId, label: t('nav.statistics') },
    { id: 'assessments' as SectionId, label: t('nav.assessments') },
    { id: 'about-assessments' as SectionId, label: t('nav.aboutAssessments') },
    { id: 'other-assessments' as SectionId, label: t('nav.otherAssessments') },
    { id: 'understanding-adhd' as SectionId, label: t('nav.understandingAdhd') },
    { id: 'medications' as SectionId, label: t('nav.medications') },
  ], [t]);

  return (
    <>
      <SkipLink />
      <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Sticky Navigation */}
        <nav 
          className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
              <LanguageToggle />
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  aria-label={`Navigate to ${item.label} section`}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    activeSection === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900">
            {t('home.title')}
        </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('home.subtitle')}
          </p>
        </div>

        {/* What is ADHD Section */}
        <div id="what-is-adhd" className="bg-white rounded-lg shadow-lg p-8 mb-8 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">{t('home.whatIsAdhd.title')}</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4 text-lg">
              <strong>{t('home.whatIsAdhd.title')}</strong> {t('home.whatIsAdhd.description')}
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold mb-3 text-blue-900">{t('home.whatIsAdhd.inattention.title')}</h3>
                <p className="text-gray-700">
                  {t('home.whatIsAdhd.inattention.description')}
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold mb-3 text-purple-900">{t('home.whatIsAdhd.hyperactivity.title')}</h3>
                <p className="text-gray-700">
                  {t('home.whatIsAdhd.hyperactivity.description')}
                </p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h3 className="text-xl font-semibold mb-3 text-orange-900">{t('home.whatIsAdhd.impulsivity.title')}</h3>
                <p className="text-gray-700">
                  {t('home.whatIsAdhd.impulsivity.description')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Learn More Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Learn More</h3>
            <div className="flex flex-wrap gap-3">
              <a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                NIMH - ADHD Information
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.cdc.gov/ncbddd/adhd/index.html" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                CDC - ADHD Resources
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://chadd.org/about-adhd/overview/" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                CHADD - About ADHD
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.mayoclinic.org/diseases-conditions/adhd/symptoms-causes/syc-20350889" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                Mayo Clinic - ADHD Overview
              </a>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div id="statistics" className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6">{t('home.statistics.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold mb-2">5-7%</div>
              <p className="text-white/90">{t('home.statistics.childrenWorldwide')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold mb-2">2.5-4%</div>
              <p className="text-white/90">{t('home.statistics.adultsEstimated')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold mb-2">~60%</div>
              <p className="text-white/90">{t('home.statistics.symptomsIntoAdulthood')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold mb-2">2:1</div>
              <p className="text-white/90">{t('home.statistics.maleToFemaleRatio')}</p>
            </div>
          </div>
          
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-3">{t('home.statistics.commonComorbidities.title')}</h3>
              <p className="text-white/90">
                {t('home.statistics.commonComorbidities.description')}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-3">{t('home.statistics.geneticFactors.title')}</h3>
              <p className="text-white/90">
                {t('home.statistics.geneticFactors.description')}
              </p>
            </div>
          </div>
          
          {/* Learn More Links */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <h3 className="text-lg font-semibold mb-3 text-white">Learn More</h3>
            <div className="flex flex-wrap gap-3 text-white/90">
              <a href="https://www.cdc.gov/ncbddd/adhd/data.html" {...EXTERNAL_LINK_ATTRS} className="hover:text-white underline text-sm">
                CDC - ADHD Data & Statistics
              </a>
              <span className="text-white/60">•</span>
              <a href="https://www.nimh.nih.gov/health/statistics/attention-deficit-hyperactivity-disorder-adhd" {...EXTERNAL_LINK_ATTRS} className="hover:text-white underline text-sm">
                NIMH - ADHD Statistics
              </a>
              <span className="text-white/60">•</span>
              <a href="https://chadd.org/about-adhd/adhd-facts-and-statistics/" {...EXTERNAL_LINK_ATTRS} className="hover:text-white underline text-sm">
                CHADD - ADHD Facts & Statistics
              </a>
              <span className="text-white/60">•</span>
              <a href="https://www.who.int/news-room/fact-sheets/detail/attention-deficit-hyperactivity-disorder" {...EXTERNAL_LINK_ATTRS} className="hover:text-white underline text-sm">
                WHO - ADHD Fact Sheet
              </a>
            </div>
          </div>
        </div>

        {/* Assessment Cards */}
        <div id="assessments" className="mb-8 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">{t('home.assessments.title')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                  {t('home.assessments.questionnaire.title')}
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  {t('home.assessments.questionnaire.description')}
                </p>
                <ul className="text-sm text-gray-500 mb-4 space-y-1">
                  <li>• {t('home.assessments.questionnaire.features.selfReport')}</li>
                  <li>• {t('home.assessments.questionnaire.features.quick')}</li>
                  <li>• {t('home.assessments.questionnaire.features.assesses')}</li>
                </ul>
              </div>
            <Link
              href={`/${locale}/assessment`}
                className="inline-block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg mt-auto"
            >
              {t('home.assessments.questionnaire.button')}
            </Link>
          </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              {t('home.assessments.cpt.title')}
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  {t('home.assessments.cpt.description')}
                </p>
                <ul className="text-sm text-gray-500 mb-4 space-y-1">
                  <li>• {t('home.assessments.cpt.features.duration')}</li>
                  <li>• {t('home.assessments.cpt.features.trials')}</li>
                  <li>• {t('home.assessments.cpt.features.measures')}</li>
                </ul>
              </div>
            <Link
              href={`/${locale}/cpt-assessment`}
                className="inline-block w-full text-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg mt-auto"
            >
              {t('home.assessments.cpt.button')}
            </Link>
          </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              {t('home.assessments.tova.title')}
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  {t('home.assessments.tova.description')}
                </p>
                <ul className="text-sm text-gray-500 mb-4 space-y-1">
                  <li>• {t('home.assessments.tova.features.duration')}</li>
                  <li>• {t('home.assessments.tova.features.halves')}</li>
                  <li>• {t('home.assessments.tova.features.differentiates')}</li>
                </ul>
              </div>
            <Link
              href={`/${locale}/tova-assessment`}
                className="inline-block w-full text-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg mt-auto"
            >
              {t('home.assessments.tova.button')}
            </Link>
          </div>
        </div>
        
        {/* Learn More Links for Assessments */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Learn More About ADHD Assessments</h3>
          <div className="flex flex-wrap gap-3">
            <a href="https://chadd.org/about-adhd/diagnosis-of-adhd-in-adults/" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
              CHADD - ADHD Diagnosis in Adults
            </a>
            <span className="text-gray-400">•</span>
            <a href="https://www.cdc.gov/ncbddd/adhd/diagnosis.html" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
              CDC - Diagnosing ADHD
            </a>
            <span className="text-gray-400">•</span>
            <a href="https://www.additudemag.com/adhd-testing-diagnosis-guide/" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
              ADDitude - ADHD Testing Guide
            </a>
          </div>
        </div>
        </div>
        {/* About Assessments Section */}
        <div id="about-assessments" className="bg-white rounded-lg shadow-lg p-8 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            About the Assessments
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            This platform provides multiple evidence-based assessment tools for ADHD screening and evaluation. 
            Each method has its own strengths and limitations, and none should be used as a standalone diagnostic tool.
          </p>
          
          <div className="space-y-8">
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                Questionnaire Assessment
              </h3>
              <p className="text-gray-700 mb-3">
                <strong>Purpose:</strong> This 18-question self-report screening tool is designed to identify symptoms consistent with ADHD in adults. It assesses both inattentive and hyperactive-impulsive symptoms across different life domains. The questionnaire is divided into two parts: Part A (first 6 questions) focuses on the most predictive symptoms for ADHD screening, while Part B (remaining 12 questions) provides additional clinical information.
              </p>
              <p className="text-gray-700 mb-2 font-semibold">
                Limitations:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>Self-report bias may affect accuracy</li>
                <li>Screening tool only, not a diagnostic instrument</li>
                <li>May not capture all ADHD symptoms or subtypes</li>
                <li>Subjective responses can vary based on self-awareness</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                CPT-3 Assessment
              </h3>
              <p className="text-gray-700 mb-3">
                <strong>Purpose:</strong> The Conners Continuous Performance Test 3rd Edition (CPT-3) is a computerized assessment that objectively measures attention and impulse control. During the 14-minute test, participants respond to target letters while inhibiting responses to non-targets. The test evaluates sustained attention, response inhibition, vigilance, and consistency of performance over time.
              </p>
              <p className="text-gray-700 mb-2 font-semibold">
                Limitations:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>May not detect all ADHD subtypes equally well</li>
                <li>Performance can be influenced by factors other than ADHD (fatigue, motivation, anxiety, etc.)</li>
                <li>Not a standalone diagnostic tool - requires clinical interpretation</li>
                <li>Requires proper administration conditions and environment</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                TOVA Assessment
              </h3>
              <p className="text-gray-700 mb-3">
                <strong>Purpose:</strong> The Test of Variables of Attention (TOVA) is a computerized continuous performance test that measures attention and impulse control using simple geometric shapes. The test consists of two halves: the first half presents infrequent targets to assess attention when targets are rare, while the second half presents frequent targets to assess impulse control when non-targets are rare.
              </p>
              <p className="text-gray-700 mb-2 font-semibold">
                Limitations:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>Can produce false positives or false negatives</li>
                <li>Performance can vary based on environmental factors and distractions</li>
                <li>Not sufficient alone for diagnosis - should be combined with other assessments</li>
                <li>May be affected by practice effects if repeated</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mt-6">
              <p className="text-lg font-semibold text-yellow-800 mb-2">
                ⚠️ Important Disclaimer
              </p>
              <p className="text-yellow-700">
                These assessments are screening tools and should not replace professional medical evaluation. 
                A comprehensive ADHD diagnosis requires clinical assessment by a qualified healthcare professional, 
                including medical history, physical examination, and consideration of multiple information sources. 
                If you have concerns about ADHD, please consult with a healthcare provider.
              </p>
            </div>
          </div>
          
          {/* Learn More Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Learn More</h3>
            <div className="flex flex-wrap gap-3">
              <a href="https://chadd.org/about-adhd/diagnosis-of-adhd-in-adults/" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                CHADD - ADHD Diagnosis
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.psychiatry.org/File%20Library/Psychiatrists/Practice/DSM/APA_DSM-5-ADHD.pdf" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                APA - DSM-5 ADHD Criteria
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.cdc.gov/ncbddd/adhd/diagnosis.html" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                CDC - ADHD Diagnosis Guidelines
              </a>
            </div>
          </div>
        </div>

        {/* Other ADHD Assessments Section */}
        <div id="other-assessments" className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-lg p-8 border-2 border-indigo-200 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Other ADHD Assessment Tools
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            While this platform focuses on specific assessments, there are many other validated tools used in ADHD evaluation. 
            The following are some commonly used assessments that are not currently available on this platform:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Rating Scales */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-indigo-800 border-b-2 border-indigo-200 pb-2">
                Rating Scales & Questionnaires
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <strong className="text-gray-900">Conners Rating Scales (CRS):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Comprehensive rating scales for parents, teachers, and self-report. Available in multiple versions 
                    (Conners 3, Conners CBRS) for different age groups.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Vanderbilt Assessment Scales:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Parent and teacher rating scales commonly used in pediatric settings to assess ADHD symptoms 
                    and related impairments.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">ADHD Rating Scale (ADHD-RS):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Standardized rating scale based on DSM criteria, available in versions for children and adults.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Adult ADHD Self-Report Scale (ASRS):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    WHO-developed screening tool for adult ADHD, available in both full and abbreviated versions.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Brown Attention-Deficit Disorder Scales (BADDS):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Comprehensive assessment focusing on executive function deficits associated with ADHD.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Barkley Adult ADHD Rating Scale (BAARS):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Self-report and observer rating scales specifically designed for adult ADHD assessment.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Wender Utah Rating Scale (WURS):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Retrospective self-report scale assessing childhood ADHD symptoms in adults.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">SNAP Rating Scale:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Swanson, Nolan, and Pelham rating scale for assessing ADHD symptoms and related behaviors.
                  </p>
                </li>
              </ul>
            </div>

            {/* Neuropsychological & Performance Tests */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-indigo-800 border-b-2 border-indigo-200 pb-2">
                Neuropsychological & Performance Tests
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <strong className="text-gray-900">IVA-2 (Integrated Visual and Auditory CPT):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Continuous performance test that measures both visual and auditory attention, providing 
                    comprehensive assessment of attention deficits.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">QbTest:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Computerized test combining attention and activity measurement using infrared motion tracking 
                    to assess hyperactivity.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Test of Everyday Attention (TEA):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Battery of tests assessing different aspects of attention including selective, sustained, 
                    and divided attention.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Delis-Kaplan Executive Function System (D-KEFS):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Comprehensive assessment of executive functions including working memory, cognitive flexibility, 
                    and inhibition.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Behavior Rating Inventory of Executive Function (BRIEF):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Rating scale assessing executive function behaviors in daily life, available for children and adults.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Conners Kiddie Continuous Performance Test (K-CPT):</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Age-appropriate version of the CPT designed specifically for children ages 4-5.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Stroop Color-Word Test:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Classic neuropsychological test measuring cognitive inhibition and selective attention.
                  </p>
                </li>
                <li>
                  <strong className="text-gray-900">Trail Making Test:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Assessment of visual attention, task switching, and processing speed, commonly used in 
                    ADHD evaluations.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This list represents only a sample of available ADHD assessment tools. 
              A comprehensive ADHD evaluation typically involves multiple assessment methods, clinical interviews, 
              behavioral observations, and consideration of developmental history. The choice of assessment tools 
              depends on the individual's age, specific concerns, and the clinical context. Always consult with 
              qualified healthcare professionals for proper assessment and diagnosis.
            </p>
          </div>
          
          {/* Learn More Links */}
          <div className="mt-6 pt-6 border-t border-indigo-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Learn More</h3>
            <div className="flex flex-wrap gap-3">
              <a href="https://chadd.org/about-adhd/diagnosis-of-adhd-in-adults/" {...EXTERNAL_LINK_ATTRS} className="text-indigo-600 hover:text-indigo-800 underline text-sm">
                CHADD - Assessment Tools
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.additudemag.com/adhd-testing-diagnosis-guide/" {...EXTERNAL_LINK_ATTRS} className="text-indigo-600 hover:text-indigo-800 underline text-sm">
                ADDitude - ADHD Testing Resources
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.apa.org/topics/adhd" {...EXTERNAL_LINK_ATTRS} className="text-indigo-600 hover:text-indigo-800 underline text-sm">
                APA - ADHD Resources
              </a>
            </div>
          </div>
        </div>

        {/* Additional Resources Section */}
        <div id="understanding-adhd" className="mt-8 bg-white rounded-lg shadow-lg p-8 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Understanding ADHD
          </h2>

          {/* ADHD Subtypes - Expanded */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              ADHD Subtypes
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h4 className="text-lg font-semibold mb-3 text-blue-900">Predominantly Inattentive (ADHD-I)</h4>
                <p className="text-gray-700 mb-3">
                  Characterized primarily by difficulties with attention and focus, with fewer hyperactive or impulsive symptoms.
                </p>
                <p className="text-sm font-semibold text-gray-800 mb-2">Common symptoms include:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Difficulty sustaining attention</li>
                  <li>• Easily distracted</li>
                  <li>• Forgetfulness</li>
                  <li>• Poor organization</li>
                  <li>• Difficulty following instructions</li>
                  <li>• Losing things frequently</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h4 className="text-lg font-semibold mb-3 text-purple-900">Predominantly Hyperactive-Impulsive (ADHD-H)</h4>
                <p className="text-gray-700 mb-3">
                  Characterized by hyperactivity and impulsivity, with fewer inattentive symptoms.
                </p>
                <p className="text-sm font-semibold text-gray-800 mb-2">Common symptoms include:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Fidgeting and restlessness</li>
                  <li>• Difficulty staying seated</li>
                  <li>• Excessive talking</li>
                  <li>• Interrupting others</li>
                  <li>• Difficulty waiting turns</li>
                  <li>• Acting without thinking</li>
                </ul>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h4 className="text-lg font-semibold mb-3 text-orange-900">Combined Type (ADHD-C)</h4>
                <p className="text-gray-700 mb-3">
                  The most common subtype, featuring significant symptoms of both inattention and hyperactivity-impulsivity.
                </p>
                <p className="text-sm font-semibold text-gray-800 mb-2">Features:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Meets criteria for both inattention and hyperactivity</li>
                  <li>• Most commonly diagnosed in children</li>
                  <li>• May present differently in adults</li>
                  <li>• Often requires comprehensive treatment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Symptoms Across Life Stages */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              Symptoms Across Life Stages
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-gray-800">Childhood & Adolescence</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Academic difficulties, poor grades despite intelligence</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Behavioral problems in school</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Social challenges and peer relationship difficulties</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Difficulty following rules and routines</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Risk-taking behaviors</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-gray-800">Adulthood</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Work performance and career challenges</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Time management and organization difficulties</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Relationship and communication issues</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Financial management problems</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Emotional regulation challenges</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Causes and Risk Factors */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              Causes and Risk Factors
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h4 className="text-lg font-semibold mb-3 text-green-900">Genetic Factors</h4>
                <p className="text-gray-700 mb-3">
                  ADHD has a strong genetic component with heritability estimated at 70-80%. If a parent has ADHD, 
                  their child has a 25-35% chance of also having ADHD.
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Family history is a significant risk factor</li>
                  <li>• Multiple genes are involved, not a single gene</li>
                  <li>• Genetic variations affect neurotransmitter systems</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                <h4 className="text-lg font-semibold mb-3 text-yellow-900">Environmental Factors</h4>
                <p className="text-gray-700 mb-3">
                  While genetics play the primary role, certain environmental factors may contribute to ADHD risk.
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Premature birth or low birth weight</li>
                  <li>• Prenatal exposure to alcohol, tobacco, or drugs</li>
                  <li>• Lead exposure in early childhood</li>
                  <li>• Brain injuries</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Treatment Options - Expanded */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              Treatment Options
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-indigo-900">Medication</h4>
                <p className="text-gray-700 mb-3">
                  Medications can be effective in managing ADHD symptoms, but should always be prescribed and monitored by a healthcare professional.
                </p>
                <p className="text-sm font-semibold text-gray-800 mb-2">Types include:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Stimulants:</strong> Most commonly prescribed (methylphenidate, amphetamines)</li>
                  <li>• <strong>Non-stimulants:</strong> Alternative option (atomoxetine, guanfacine)</li>
                  <li>• <strong>Antidepressants:</strong> Sometimes used for comorbid conditions</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3 italic">
                  Medication effectiveness varies by individual and should be part of a comprehensive treatment plan.
                </p>
              </div>
              <div className="bg-teal-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-teal-900">Therapy & Behavioral Interventions</h4>
                <p className="text-gray-700 mb-3">
                  Various therapeutic approaches can help individuals develop coping strategies and improve functioning.
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Cognitive Behavioral Therapy (CBT):</strong> Addresses thought patterns and behaviors</li>
                  <li>• <strong>Behavioral Therapy:</strong> Focuses on modifying behaviors and developing skills</li>
                  <li>• <strong>Parent Training:</strong> Helps parents support children with ADHD</li>
                  <li>• <strong>Social Skills Training:</strong> Improves interpersonal relationships</li>
                  <li>• <strong>Executive Function Coaching:</strong> Develops organization and planning skills</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Coping Strategies and Accommodations */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              Coping Strategies & Accommodations
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-5 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-blue-900">For Students</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Extended time on tests</li>
                  <li>• Preferential seating</li>
                  <li>• Note-taking assistance</li>
                  <li>• Breaks during long tasks</li>
                  <li>• Organizational support</li>
                  <li>• Reduced homework load</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-5 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-purple-900">For Adults at Work</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Flexible work schedules</li>
                  <li>• Quiet workspace</li>
                  <li>• Written instructions</li>
                  <li>• Task prioritization support</li>
                  <li>• Regular check-ins</li>
                  <li>• Noise-canceling headphones</li>
                </ul>
              </div>
              <div className="bg-orange-50 p-5 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-orange-900">Daily Life Strategies</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Use calendars and reminders</li>
                  <li>• Break tasks into smaller steps</li>
                  <li>• Establish routines</li>
                  <li>• Minimize distractions</li>
                  <li>• Regular exercise</li>
                  <li>• Adequate sleep</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Myths vs Facts */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              Common Myths vs. Facts
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
                <h4 className="text-lg font-semibold mb-3 text-red-900">Myths</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"ADHD is caused by bad parenting or too much sugar"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"ADHD only affects children and they grow out of it"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"People with ADHD just need to try harder"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"ADHD medication is dangerous and addictive"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"ADHD isn't a real condition"</span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                <h4 className="text-lg font-semibold mb-3 text-green-900">Facts</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>ADHD is a neurobiological condition with strong genetic components</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>ADHD persists into adulthood for 60% of those diagnosed in childhood</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>ADHD involves real brain differences that affect executive function</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>When properly prescribed and monitored, ADHD medications are safe and effective</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>ADHD is recognized by major medical organizations worldwide</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Getting Help */}
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">
              Getting Help and Support
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800">Professional Resources</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Consult with a psychiatrist, psychologist, or neurologist specializing in ADHD</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Seek comprehensive evaluation including clinical interview and assessment tools</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Work with therapists trained in ADHD-specific interventions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Consider ADHD coaches for practical skill development</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800">Support Networks</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Join ADHD support groups (in-person or online)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Connect with ADHD advocacy organizations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Educate family and friends about ADHD</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Access educational resources and research</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300">
              <p className="text-sm text-gray-800">
                <strong>Remember:</strong> Early diagnosis and appropriate treatment can significantly improve quality of life. 
                If you suspect you or a loved one may have ADHD, don't hesitate to seek professional evaluation. 
                With proper support, individuals with ADHD can thrive and succeed in all areas of life.
              </p>
            </div>
          </div>
          
          {/* Learn More Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Learn More</h3>
            <div className="flex flex-wrap gap-3">
              <a href="https://chadd.org/about-adhd/overview/" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                CHADD - Understanding ADHD
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                NIMH - ADHD Information
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.additudemag.com/" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                ADDitude Magazine
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.mayoclinic.org/diseases-conditions/adhd" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                Mayo Clinic - ADHD
              </a>
            </div>
          </div>
        </div>

        {/* Medications Section */}
        <div id="medications" className="mt-8 bg-white rounded-lg shadow-lg p-8 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            ADHD Medications
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            Medication can be an effective component of ADHD treatment when prescribed and monitored by a qualified healthcare professional. 
            This section provides information about common ADHD medications, their mechanisms, and important considerations.
          </p>

          {/* Important Disclaimer */}
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
            <p className="text-lg font-semibold text-red-800 mb-2">
              ⚠️ Important Medical Disclaimer
            </p>
            <p className="text-red-700">
              The information provided here is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment. 
              Always consult with a qualified healthcare provider before starting, stopping, or changing any medication. Only licensed healthcare professionals 
              can prescribe ADHD medications after a proper evaluation.
            </p>
          </div>

          {/* Stimulant Medications */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              Stimulant Medications
            </h3>
            <p className="text-gray-700 mb-4">
              Stimulants are the most commonly prescribed medications for ADHD and are considered first-line treatment. 
              They work by increasing the levels of certain neurotransmitters (dopamine and norepinephrine) in the brain, 
              which helps improve attention, focus, and impulse control.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Methylphenidate-based */}
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h4 className="text-lg font-semibold mb-3 text-blue-900">Methylphenidate-Based Medications</h4>
                <p className="text-gray-700 mb-3 text-sm">
                  These medications are available in various formulations with different durations of action.
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>
                    <strong>Ritalin (immediate-release):</strong> Short-acting, typically lasts 3-4 hours
                  </li>
                  <li>
                    <strong>Ritalin LA (long-acting):</strong> Extended-release, lasts 8-12 hours
                  </li>
                  <li>
                    <strong>Concerta (extended-release):</strong> Once-daily dosing, lasts 10-12 hours
                  </li>
                  <li>
                    <strong>Daytrana (patch):</strong> Transdermal patch, provides consistent delivery
                  </li>
                  <li>
                    <strong>Focalin / Focalin XR:</strong> Dexmethylphenidate, similar to methylphenidate
                  </li>
                  <li>
                    <strong>Quillivant XR / Quillichew ER:</strong> Liquid and chewable formulations
                  </li>
                </ul>
              </div>

              {/* Amphetamine-based */}
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h4 className="text-lg font-semibold mb-3 text-purple-900">Amphetamine-Based Medications</h4>
                <p className="text-gray-700 mb-3 text-sm">
                  These medications also increase dopamine and norepinephrine, with slightly different mechanisms.
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>
                    <strong>Adderall / Adderall XR:</strong> Mixed amphetamine salts, immediate and extended-release
                  </li>
                  <li>
                    <strong>Vyvanse (lisdexamfetamine):</strong> Prodrug that converts to dextroamphetamine, long-acting
                  </li>
                  <li>
                    <strong>Dexedrine / Dexedrine Spansule:</strong> Dextroamphetamine, immediate and extended-release
                  </li>
                  <li>
                    <strong>Evekeo:</strong> Racemic amphetamine sulfate
                  </li>
                  <li>
                    <strong>Mydayis:</strong> Triple-bead delivery system, lasts up to 16 hours
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Stimulant medications are controlled substances and require careful monitoring. 
                Common side effects may include decreased appetite, sleep difficulties, headaches, and increased heart rate or blood pressure. 
                These medications should not be used by individuals with certain heart conditions, glaucoma, or a history of substance abuse.
              </p>
            </div>
          </div>

          {/* Non-Stimulant Medications */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-green-200 pb-2">
              Non-Stimulant Medications
            </h3>
            <p className="text-gray-700 mb-4">
              Non-stimulant medications may be preferred when stimulants are not suitable, cause intolerable side effects, 
              or when there are concerns about abuse potential. They work through different mechanisms than stimulants.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h4 className="text-lg font-semibold mb-3 text-green-900">Atomoxetine (Strattera)</h4>
                <p className="text-gray-700 mb-3 text-sm">
                  A selective norepinephrine reuptake inhibitor (SNRI) that is not a controlled substance.
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Takes 2-4 weeks to see full effects</li>
                  <li>• Once-daily dosing</li>
                  <li>• May help with anxiety symptoms</li>
                  <li>• Common side effects: nausea, fatigue, decreased appetite</li>
                  <li>• May cause liver problems in rare cases</li>
                </ul>
              </div>

              <div className="bg-teal-50 p-6 rounded-lg border-l-4 border-teal-500">
                <h4 className="text-lg font-semibold mb-3 text-teal-900">Alpha-2 Agonists</h4>
                <p className="text-gray-700 mb-3 text-sm">
                  These medications work by affecting norepinephrine receptors in the prefrontal cortex.
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>
                    <strong>Guanfacine (Intuniv, Tenex):</strong> Extended-release formulation, may help with hyperactivity and impulsivity
                  </li>
                  <li>
                    <strong>Clonidine (Kapvay, Catapres):</strong> Can help with hyperactivity, impulsivity, and sleep issues
                  </li>
                </ul>
                <p className="text-sm text-gray-700 mt-3">
                  Common side effects: drowsiness, fatigue, low blood pressure, dizziness. These medications should not be stopped abruptly.
                </p>
              </div>
            </div>
          </div>

          {/* Medication Considerations */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-indigo-200 pb-2">
              Important Considerations
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-indigo-900">Finding the Right Medication</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Medication effectiveness varies significantly between individuals</li>
                  <li>• Finding the right medication and dosage often requires trial and adjustment</li>
                  <li>• Factors to consider: symptom profile, lifestyle, comorbidities, side effect tolerance</li>
                  <li>• Regular follow-ups with your healthcare provider are essential</li>
                  <li>• Dosage may need adjustment over time</li>
                </ul>
              </div>

              <div className="bg-pink-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-pink-900">Monitoring & Safety</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Regular monitoring of blood pressure and heart rate</li>
                  <li>• Tracking height and weight in children</li>
                  <li>• Monitoring for side effects and effectiveness</li>
                  <li>• Discussing any concerns or changes with your doctor</li>
                  <li>• Not sharing medications with others</li>
                  <li>• Storing medications securely</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Medication Myths vs Facts */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              Medication Myths vs. Facts
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
                <h4 className="text-lg font-semibold mb-3 text-red-900">Common Myths</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"ADHD medications are dangerous and addictive"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"Medications will change your personality"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"Once you start medication, you'll need it forever"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"Medications are a 'quick fix' and don't require other treatments"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">✗</span>
                    <span>"All ADHD medications work the same way"</span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                <h4 className="text-lg font-semibold mb-3 text-green-900">Facts</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>When properly prescribed and monitored, ADHD medications are generally safe and effective</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>Medications help manage symptoms but don't fundamentally change who you are</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>Many people can stop or adjust medications as their needs change</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>Medication is most effective when combined with therapy, behavioral strategies, and lifestyle changes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-2">✓</span>
                    <span>Different medications work differently; finding the right one is a personalized process</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Medication and Other Treatments */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">
              Medication as Part of Comprehensive Treatment
            </h3>
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                Medication is often most effective when used as part of a comprehensive treatment plan that may include:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>Behavioral therapy</strong> to develop coping strategies</li>
                  <li>• <strong>Cognitive behavioral therapy (CBT)</strong> for thought patterns</li>
                  <li>• <strong>Executive function coaching</strong> for organization skills</li>
                  <li>• <strong>Educational support</strong> and accommodations</li>
                </ul>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>Lifestyle modifications</strong> (exercise, sleep, nutrition)</li>
                  <li>• <strong>Support groups</strong> and peer connections</li>
                  <li>• <strong>Family therapy</strong> or parent training</li>
                  <li>• <strong>Workplace accommodations</strong> for adults</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Talking to Your Doctor */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-blue-900">
              Talking to Your Healthcare Provider
            </h3>
            <p className="text-gray-700 mb-3">
              If you're considering medication for ADHD, here are some questions to discuss with your healthcare provider:
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• What are the potential benefits and risks of medication for my specific situation?</li>
              <li>• What types of medications are available and how do they differ?</li>
              <li>• What side effects should I watch for?</li>
              <li>• How long will it take to see effects?</li>
              <li>• How will we monitor the medication's effectiveness?</li>
              <li>• Are there any interactions with other medications or conditions I should know about?</li>
              <li>• What should I do if I experience side effects?</li>
              <li>• How long might I need to take medication?</li>
            </ul>
            <p className="text-sm text-gray-700 mt-4 font-semibold">
              Remember: Open communication with your healthcare provider is essential for safe and effective medication management.
            </p>
          </div>
          
          {/* Learn More Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Learn More</h3>
            <div className="flex flex-wrap gap-3">
              <a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                NIMH - ADHD Treatment
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://chadd.org/about-adhd/treatment/" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                CHADD - ADHD Treatment
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.cdc.gov/ncbddd/adhd/treatment.html" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                CDC - ADHD Treatment
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.mayoclinic.org/diseases-conditions/adhd/diagnosis-treatment/drc-20350895" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                Mayo Clinic - ADHD Treatment
              </a>
              <span className="text-gray-400">•</span>
              <a href="https://www.additudemag.com/adhd-medication-guide/" {...EXTERNAL_LINK_ATTRS} className="text-blue-600 hover:text-blue-800 underline text-sm">
                ADDitude - ADHD Medication Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}

