import React, { useState, useEffect } from 'react';

interface AIBubbleMenuProps {
  visible: boolean;
  top: number;
  left: number;
  showRewriteInput?: boolean;
  setShowRewriteInput?: (show: boolean) => void;
  rewriteInstruction?: string;
  setRewriteInstruction?: (instruction: string) => void;
  onExpand?: (amount: string, option: string) => void;
  onShorten?: (option: string) => void;
  onToneChange?: (tone: string) => void;
}

const expandOptions = [
  'Add more detail',
  'Elaborate on points',
  'Include examples',
  'Provide context'
];

const expandAmounts = [
  'Little bit',
  'Medium',
  'A lot',
  'Significantly'
];

const shortenOptions = [
  'Make concise',
  'Remove repetition',
  'Simplify language',
  'Focus on key points'
];

const toneOptions = [
  'Descriptive',
  'Narrative',
  'Conversational',
  'Poetic',
  'Mysterious',
  'Dramatic',
  'Humorous'
];

export default function AIBubbleMenu({ 
  visible, 
  top, 
  left, 
  showRewriteInput = false, 
  setShowRewriteInput = () => {}, 
  rewriteInstruction = '', 
  setRewriteInstruction = () => {}, 
  onExpand = () => {},
  onShorten = () => {},
  onToneChange = () => {}
}: AIBubbleMenuProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredExpandOption, setHoveredExpandOption] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  const [isChangingTone, setIsChangingTone] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!activeDropdown) return;
    
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  if (!visible) return null;

  // Check if any AI operation is in progress
  const isAnyAIOperationInProgress = isExpanding || isShortening || isChangingTone || isRewriting;

  const handleDropdownClick = (dropdownType: string) => {
    setActiveDropdown(activeDropdown === dropdownType ? null : dropdownType);
  };

  const handleOptionClick = async (action: string, option: string) => {
    console.log(`${action}: ${option}`);
    setActiveDropdown(null);
    
    // Set loading state based on action
    if (action === 'Expand') {
      setIsExpanding(true);
      const [amount, expandOption] = option.split(' - ');
      try {
        // Add a 3-second delay to see the loading state
        await new Promise(resolve => setTimeout(resolve, 3000));
        await onExpand(amount, expandOption);
      } finally {
        setIsExpanding(false);
      }
    } else if (action === 'Shorten') {
      setIsShortening(true);
      try {
        // Add a 3-second delay to see the loading state
        await new Promise(resolve => setTimeout(resolve, 3000));
        await onShorten(option);
      } finally {
        setIsShortening(false);
      }
    } else if (action === 'Change tone') {
      setIsChangingTone(true);
      try {
        // Add a 3-second delay to see the loading state
        await new Promise(resolve => setTimeout(resolve, 3000));
        await onToneChange(option);
      } finally {
        setIsChangingTone(false);
      }
    }
  };

  const handleRewriteClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    console.log('🔘 Rewrite button clicked!');
    console.log('📋 Current showRewriteInput state:', showRewriteInput);
    console.log('🎯 Event target:', event.target);
    
    // Only toggle the rewrite input, don't affect the AI menu
    const newState = !showRewriteInput;
    console.log('🔄 Setting showRewriteInput to:', newState);
    setShowRewriteInput(newState);
    
    if (showRewriteInput) {
      console.log('🧹 Clearing rewrite instruction');
      setRewriteInstruction('');
    }
    
    // Prevent this from being treated as a selection change
    return false;
  };

  const handleRewriteSubmit = async (event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    console.log('🚀 Rewrite submit triggered!');
    console.log('📝 Instruction:', rewriteInstruction);
    
    if (rewriteInstruction.trim()) {
      console.log('✅ Valid instruction, proceeding with rewrite...');
      setIsRewriting(true);
      
      try {
        // This will be handled by the parent component
        console.log('🔄 Setting rewrite state...');
        setRewriteInstruction('');
        setShowRewriteInput(false);
      } catch (error) {
        console.log('💥 Error in rewrite submit:', error);
      } finally {
        setIsRewriting(false);
      }
    } else {
      console.log('❌ No rewrite instruction provided');
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        zIndex: 1000,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '2px 6px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,

      }}
      className="ai-bubble-menu"
    >

      
      {/* Expand dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          className="px-2 py-1 text-xs text-gray-800 font-medium hover:bg-gray-100 rounded focus:outline-none flex items-center gap-1"
          style={{ border: 'none', background: 'none', minWidth: 0, whiteSpace: 'nowrap' }}
          onClick={() => handleDropdownClick('expand')}
          disabled={isExpanding}
        >
          {isExpanding ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span>Expanding...</span>
            </>
          ) : (
            <>
              Expand
              <span style={{ fontSize: '10px' }}>▼</span>
            </>
          )}
        </button>
        {activeDropdown === 'expand' && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              minWidth: 140,
              zIndex: 1001,
              marginTop: 2,
            }}
          >
            {expandAmounts.map((amount) => (
              <div
                key={amount}
                className="px-3 py-2 text-xs text-gray-800 hover:bg-gray-100 cursor-pointer relative"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={() => setHoveredExpandOption(amount)}
                onMouseLeave={() => setHoveredExpandOption(null)}
              >
                <span>{amount}</span>
                <span style={{ fontSize: '10px', marginLeft: '8px' }}>▶</span>
                
                {/* Sub-dropdown for expand types */}
                {hoveredExpandOption === amount && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: 0,
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: 4,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      minWidth: 140,
                      zIndex: 1002,
                      marginLeft: 2,
                    }}
                  >
                    {expandOptions.map((option) => (
                      <div
                        key={option}
                        className="px-3 py-2 text-xs text-gray-800 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleOptionClick('Expand', `${amount} - ${option}`)}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 18, width: 1, background: '#e5e7eb', margin: '0 4px' }} />

      {/* Shorten dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          className="px-2 py-1 text-xs text-gray-800 font-medium hover:bg-gray-100 rounded focus:outline-none flex items-center gap-1"
          style={{ border: 'none', background: 'none', minWidth: 0, whiteSpace: 'nowrap' }}
          onClick={() => handleDropdownClick('shorten')}
          disabled={isShortening}
        >
          {isShortening ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span>Shortening...</span>
            </>
          ) : (
            <>
              Shorten
              <span style={{ fontSize: '10px' }}>▼</span>
            </>
          )}
        </button>
        {activeDropdown === 'shorten' && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              minWidth: 140,
              zIndex: 1001,
              marginTop: 2,
            }}
          >
            {shortenOptions.map((option) => (
              <div
                key={option}
                className="px-3 py-2 text-xs text-gray-800 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleOptionClick('Shorten', option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 18, width: 1, background: '#e5e7eb', margin: '0 4px' }} />

      {/* Change tone dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          className="px-2 py-1 text-xs text-gray-800 font-medium hover:bg-gray-100 rounded focus:outline-none flex items-center gap-1"
          style={{ border: 'none', background: 'none', minWidth: 0, whiteSpace: 'nowrap' }}
          onClick={() => handleDropdownClick('tone')}
          disabled={isChangingTone}
        >
          {isChangingTone ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span>Changing...</span>
            </>
          ) : (
            <>
              Change tone
              <span style={{ fontSize: '10px' }}>▼</span>
            </>
          )}
        </button>
        {activeDropdown === 'tone' && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              minWidth: 140,
              zIndex: 1001,
              marginTop: 2,
            }}
          >
            {toneOptions.map((option) => (
              <div
                key={option}
                className="px-3 py-2 text-xs text-gray-800 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleOptionClick('Change tone', option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 18, width: 1, background: '#e5e7eb', margin: '0 4px' }} />

            {/* Rewrite button */}
      <button
        className="px-2 py-1 text-xs text-gray-800 font-medium hover:bg-gray-100 rounded focus:outline-none flex items-center gap-1"
        style={{ border: 'none', background: 'none', minWidth: 0, whiteSpace: 'nowrap' }}
        onClick={handleRewriteClick}
        disabled={isRewriting}
      >
        {isRewriting ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span>Rewriting...</span>
          </>
        ) : (
          'Rewrite'
        )}
      </button>
    </div>
  );
} 