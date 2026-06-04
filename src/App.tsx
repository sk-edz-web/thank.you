import { useState } from 'react';
import IntroScreen from './components/IntroScreen';
import CodePrompt from './components/CodePrompt';
import CardViewer from './components/CardViewer';
import AdminPanel from './components/AdminPanel';
import { Card } from './types';

type FlowStep = 'intro' | 'prompt' | 'viewer' | 'admin';

export default function App() {
  const [step, setStep] = useState<FlowStep>('intro');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const handleStepAfterIntro = () => {
    setStep('prompt');
  };

  const handleCodeValid = (cardData: Card) => {
    setSelectedCard(cardData);
    setStep('viewer');
  };

  const handleAdminUnlocked = () => {
    setStep('admin');
  };

  const handleBackToPrompt = () => {
    setSelectedCard(null);
    setStep('prompt');
  };

  return (
    <div id="application-container" className="min-h-screen bg-slate-950 text-white select-none">
      {step === 'intro' && (
        <IntroScreen onComplete={handleStepAfterIntro} />
      )}

      {step === 'prompt' && (
        <CodePrompt 
          onCodeValid={handleCodeValid} 
          onAdminOpen={handleAdminUnlocked} 
        />
      )}

      {step === 'viewer' && selectedCard && (
        <CardViewer 
          card={selectedCard} 
          onBack={handleBackToPrompt} 
        />
      )}

      {step === 'admin' && (
        <AdminPanel 
          onBack={handleBackToPrompt} 
        />
      )}
    </div>
  );
}
