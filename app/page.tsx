'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [activeSection, setActiveSection] = useState('');
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Don't update during programmatic scrolling
      if (isProgrammaticScroll) {
        return;
      }

      const sections = ['what-is-adhd', 'statistics', 'assessments', 'about-assessments', 'other-assessments', 'understanding-adhd'];
      const scrollPosition = window.scrollY + 150; // Offset for sticky nav

      // Check sections from bottom to top to prioritize later sections when at boundaries
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = window.scrollY + rect.top;
          const elementBottom = elementTop + rect.height;
          
          // Check if scroll position is within this section
          // Be more strict - require scroll to be past the start of the section
          if (scrollPosition >= elementTop && scrollPosition < elementBottom + 50) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check on mount
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isProgrammaticScroll]);

  const scrollToSection = (id: string) => {
    // Immediately set the active section when clicking
    setActiveSection(id);
    setIsProgrammaticScroll(true);
    
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Keep the target section active during scroll
      const checkInterval = setInterval(() => {
        setActiveSection(id);
      }, 50);

      // After scroll completes, re-enable scroll detection and verify
      setTimeout(() => {
        clearInterval(checkInterval);
        setIsProgrammaticScroll(false);
        // Force the correct section one more time
        setActiveSection(id);
        
        // Verify after a short delay
        setTimeout(() => {
          const scrollPosition = window.scrollY + 150;
          const rect = element.getBoundingClientRect();
          const elementTop = window.scrollY + rect.top;
          const elementBottom = elementTop + rect.height;
          
          if (scrollPosition >= elementTop && scrollPosition < elementBottom + 50) {
            setActiveSection(id);
          }
        }, 100);
      }, 800); // Wait for smooth scroll to complete
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            <button
              onClick={() => scrollToSection('what-is-adhd')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'what-is-adhd'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              What is ADHD?
            </button>
            <button
              onClick={() => scrollToSection('statistics')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'statistics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => scrollToSection('assessments')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'assessments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Assessments
            </button>
            <button
              onClick={() => scrollToSection('about-assessments')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'about-assessments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              About Tests
            </button>
            <button
              onClick={() => scrollToSection('other-assessments')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'other-assessments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Other Tools
            </button>
            <button
              onClick={() => scrollToSection('understanding-adhd')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'understanding-adhd'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Understanding ADHD
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900">
            ADHD Assessment Platform
        </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive assessment tools to help understand attention, focus, and impulse control patterns
          </p>
        </div>

        {/* What is ADHD Section */}
        <div id="what-is-adhd" className="bg-white rounded-lg shadow-lg p-8 mb-8 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">What is ADHD?</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4 text-lg">
              <strong>Attention-Deficit/Hyperactivity Disorder (ADHD)</strong> is a neurodevelopmental disorder 
              characterized by persistent patterns of inattention, hyperactivity, and impulsivity that interfere 
              with functioning or development. ADHD affects both children and adults and can impact various aspects 
              of daily life including work, school, relationships, and self-esteem.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold mb-3 text-blue-900">Inattention</h3>
                <p className="text-gray-700">
                  Difficulty sustaining attention, following through on tasks, organizing activities, 
                  and being easily distracted by external stimuli.
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold mb-3 text-purple-900">Hyperactivity</h3>
                <p className="text-gray-700">
                  Excessive fidgeting, restlessness, difficulty staying seated, and feeling the need 
                  to be constantly in motion.
                </p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h3 className="text-xl font-semibold mb-3 text-orange-900">Impulsivity</h3>
                <p className="text-gray-700">
                  Acting without thinking, interrupting others, difficulty waiting turns, and making 
                  hasty decisions without considering consequences.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div id="statistics" className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6">ADHD Statistics & Facts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold mb-2">5-7%</div>
              <p className="text-white/90">of children worldwide are diagnosed with ADHD</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold mb-2">2.5-4%</div>
              <p className="text-white/90">of adults are estimated to have ADHD</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold mb-2">~60%</div>
              <p className="text-white/90">of children with ADHD continue to have symptoms into adulthood</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold mb-2">2:1</div>
              <p className="text-white/90">ratio of males to females diagnosed with ADHD in childhood</p>
            </div>
          </div>
          
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-3">Common Comorbidities</h3>
              <p className="text-white/90">
                ADHD often co-occurs with other conditions including anxiety disorders (25-40%), 
                depression (20-30%), learning disabilities (20-30%), and oppositional defiant disorder.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-3">Genetic Factors</h3>
              <p className="text-white/90">
                ADHD has a strong genetic component with heritability estimated at 70-80%. 
                If a parent has ADHD, their child has a 25-35% chance of also having ADHD.
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Cards */}
        <div id="assessments" className="mb-8 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">Available Assessments</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                  Questionnaire Assessment
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  Complete the 18-question ADHD assessment questionnaire to screen for symptoms.
                </p>
                <ul className="text-sm text-gray-500 mb-4 space-y-1">
                  <li>• Self-report screening tool</li>
                  <li>• Quick assessment (~5-10 minutes)</li>
                  <li>• Assesses inattentive and hyperactive-impulsive symptoms</li>
                </ul>
              </div>
            <Link
              href="/assessment"
                className="inline-block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg mt-auto"
            >
              Start Questionnaire
            </Link>
          </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              CPT-3 Assessment
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  Conners Continuous Performance Test - objective measurement of attention and impulse control.
                </p>
                <ul className="text-sm text-gray-500 mb-4 space-y-1">
                  <li>• 14 minutes duration</li>
                  <li>• 360 trials</li>
                  <li>• Measures sustained attention and response inhibition</li>
                </ul>
              </div>
            <Link
              href="/cpt-assessment"
                className="inline-block w-full text-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg mt-auto"
            >
              Start CPT Test
            </Link>
          </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              TOVA Assessment
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  Test of Variables of Attention - measures attention and impulse control with geometric shapes.
                </p>
                <ul className="text-sm text-gray-500 mb-4 space-y-1">
                  <li>• 21.6 minutes duration</li>
                  <li>• Two halves (infrequent vs frequent targets)</li>
                  <li>• Differentiates between inattention and impulsivity</li>
                </ul>
              </div>
            <Link
              href="/tova-assessment"
                className="inline-block w-full text-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg mt-auto"
            >
              Start TOVA Test
            </Link>
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
        </div>
      </div>
    </main>
  );
}

