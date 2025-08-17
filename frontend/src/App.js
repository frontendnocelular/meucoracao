import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart } from 'lucide-react';
import * as THREE from 'three';
import "./App.css";

const DeclarationSite = () => {
  const [stage, setStage] = useState('hearts');
  const [showProposal, setShowProposal] = useState(false);
  const [proposalAnswered, setProposalAnswered] = useState(false);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 250, y: 180 });
  const [yesClicked, setYesClicked] = useState(false);
  
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

  // Three.js hearts setup
  useEffect(() => {
    if (stage === 'hearts' && mountRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      mountRef.current.appendChild(renderer.domElement);
      
      sceneRef.current = scene;
      rendererRef.current = renderer;
      
      // Create heart shape geometry
      const createHeartShape = () => {
        const heartShape = new THREE.Shape();
        const x = 0, y = 0;
        heartShape.moveTo(x + 5, y + 5);
        heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        heartShape.bezierCurveTo(x - 6, y, x - 6, y + 3.5, x - 6, y + 3.5);
        heartShape.bezierCurveTo(x - 6, y + 5.5, x - 4, y + 7.7, x, y + 10);
        heartShape.bezierCurveTo(x + 4, y + 7.7, x + 6, y + 5.5, x + 6, y + 3.5);
        heartShape.bezierCurveTo(x + 6, y + 3.5, x + 6, y, x, y);
        return heartShape;
      };

      const heartShape = createHeartShape();
      
      // Create three main hearts
      const hearts = [];
      const positions = [
        { x: -8, y: 0, z: 0, scale: 0.3, color: 0xff69b4 },  // Left heart
        { x: 0, y: 0, z: 0, scale: 0.5, color: 0xff1744 },   // Center heart (bigger)
        { x: 8, y: 0, z: 0, scale: 0.3, color: 0xff69b4 }    // Right heart
      ];
      
      positions.forEach((pos, index) => {
        const geometry = new THREE.ExtrudeGeometry(heartShape, {
          depth: 2,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 2,
          bevelSize: 0.5,
          bevelThickness: 0.5
        });
        
        const material = new THREE.MeshBasicMaterial({ 
          color: pos.color,
          transparent: true,
          opacity: 0.9 
        });
        
        const heart = new THREE.Mesh(geometry, material);
        heart.position.set(pos.x, pos.y, pos.z);
        heart.scale.setScalar(pos.scale);
        heart.rotation.z = Math.PI;
        
        heart.userData = {
          originalScale: pos.scale,
          pulsePhase: index * Math.PI / 3,
          disperseDelay: index * 500
        };
        
        scene.add(heart);
        hearts.push(heart);
      });
      
      camera.position.z = 25;
      
      let startTime = Date.now();
      let disperseStarted = false;
      const particles = [];
      
      // Animation loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        const elapsed = Date.now() - startTime;
        
        if (elapsed < 5000) {
          // Pulse animation for hearts
          hearts.forEach((heart) => {
            const pulse = Math.sin((elapsed * 0.003) + heart.userData.pulsePhase) * 0.1 + 1;
            heart.scale.setScalar(heart.userData.originalScale * pulse);
            heart.rotation.y += 0.005;
          });
        } else if (!disperseStarted) {
          // Start dispersion after 5 seconds
          disperseStarted = true;
          
          hearts.forEach((heart) => {
            // Create particles from each heart
            for (let i = 0; i < 30; i++) {
              const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
              const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: heart.material.color,
                transparent: true,
                opacity: 0.8 
              });
              const particle = new THREE.Mesh(particleGeometry, particleMaterial);
              
              particle.position.copy(heart.position);
              particle.userData = {
                velocity: new THREE.Vector3(
                  (Math.random() - 0.5) * 0.3,
                  (Math.random() - 0.5) * 0.3,
                  (Math.random() - 0.5) * 0.3
                ),
                life: 1.0,
                originalColor: heart.material.color
              };
              
              scene.add(particle);
              particles.push(particle);
            }
            
            // Remove original heart
            scene.remove(heart);
          });
        } else {
          // Animate particles
          particles.forEach((particle, index) => {
            if (particle.userData.life > 0) {
              particle.position.add(particle.userData.velocity);
              particle.userData.life -= 0.005;
              particle.material.opacity = particle.userData.life;
              particle.rotation.x += 0.1;
              particle.rotation.y += 0.1;
            }
          });
          
          // Transition to card after particles fade
          if (elapsed > 8000) {
            setStage('card');
          }
        }
        
        renderer.render(scene, camera);
      };
      
      animate();
      
      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }
  }, [stage]);

  // Card stage and proposal
  useEffect(() => {
    if (stage === 'card') {
      const timer = setTimeout(() => setShowProposal(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handleYesClick = useCallback(() => {
    setYesClicked(true);
    setTimeout(() => {
      setShowProposal(false);
      setProposalAnswered(true);
      setStage('letter');
    }, 2500);
  }, []);

  const handleNoClick = useCallback((e) => {
    e.preventDefault();
    // Modal dimensions: max-w-md (448px) with padding
    const modalWidth = 400;
    const modalHeight = 300;
    const buttonWidth = 120;
    const buttonHeight = 60;
    
    // Random position within modal bounds
    const newX = Math.random() * (modalWidth - buttonWidth) + 20;
    const newY = Math.random() * (modalHeight - buttonHeight) + 80;
    
    setNoButtonPosition({ x: newX, y: newY });
  }, []);

  // Floating hearts component with advanced animations
  const FloatingHeart = ({ delay, size = 'w-6 h-6', color = 'text-pink-400' }) => (
    <div
      className={`absolute ${size} ${color} pointer-events-none z-10`}
      style={{
        left: `${Math.random() * 80 + 10}%`,
        animation: `floatUp 4s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
        filter: 'drop-shadow(0 0 10px rgba(255, 182, 193, 0.7))'
      }}
    >
      <Heart className="w-full h-full fill-current animate-pulse" />
    </div>
  );

  if (stage === 'hearts') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient background with animation */}
        <div 
          className="absolute inset-0 opacity-90"
          style={{
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 8s ease infinite'
          }}
        />
        
        {/* Three.js container */}
        <div ref={mountRef} className="absolute inset-0 z-10" />
        
        {/* Stars background */}
        <div className="absolute inset-0 z-5">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.8 + 0.2
              }}
            />
          ))}
        </div>
        
        <style jsx>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-90"
        style={{
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite'
        }}
      />
      
      {/* Floating elements background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <FloatingHeart 
            key={i} 
            delay={i * 200} 
            size={i % 3 === 0 ? 'w-8 h-8' : 'w-4 h-4'}
            color={['text-pink-300', 'text-red-300', 'text-purple-300'][i % 3]}
          />
        ))}
      </div>

      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        {/* Main card with glassmorphism */}
        <div 
          className="relative bg-gradient-to-br from-pink-200/30 to-red-200/30 backdrop-blur-xl border border-pink-300/50 rounded-3xl p-8 max-w-4xl w-full shadow-2xl transform transition-all duration-1000"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Card floating hearts with better animation */}
          {stage === 'card' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 90 + 5}%`,
                    bottom: '-10px',
                    animation: `floatUp 4s linear infinite`,
                    animationDelay: `${i * 300}ms`
                  }}
                >
                  <Heart 
                    className={`w-6 h-6 fill-current ${
                      ['text-red-500', 'text-pink-400', 'text-purple-500'][i % 3]
                    }`}
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Proposal Modal - WITH RED BUTTON INSIDE */}
          {showProposal && !proposalAnswered && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
              <div 
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-10 max-w-md mx-4 text-center shadow-2xl transform transition-all duration-500 scale-110 relative"
                style={{
                  boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="mb-6">
                  <Heart className="w-16 h-16 text-red-500 fill-current mx-auto animate-bounce" />
                </div>
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-8">
                  Quer casar comigo?
                </h2>
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={handleYesClick}
                    className={`px-10 py-4 rounded-xl font-bold text-white transition-all duration-500 transform hover:scale-105 ${
                      yesClicked 
                        ? 'bg-white border-4 border-green-500 text-green-500 shadow-lg' 
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                    }`}
                    style={{
                      boxShadow: yesClicked ? '0 0 30px rgba(34, 197, 94, 0.5)' : '0 10px 25px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    {yesClicked ? (
                      <div className="flex items-center space-x-2">
                        <span>Sim</span>
                        {[...Array(5)].map((_, i) => (
                          <Heart 
                            key={i}
                            className="w-4 h-4 fill-current animate-ping text-green-500" 
                            style={{ animationDelay: `${i * 200}ms` }}
                          />
                        ))}
                      </div>
                    ) : (
                      'Sim ✨'
                    )}
                  </button>
                  
                  <button
                    onClick={handleNoClick}
                    className="px-10 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-xl absolute"
                    style={{
                      left: `${noButtonPosition.x}px`,
                      top: `${noButtonPosition.y}px`,
                      boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    Não
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Letter content with better typography */}
          {stage === 'letter' && (
            <div className="text-gray-800">
              <h1 className="text-5xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-pink-600 to-purple-600">
                Para Adélia ❤️
              </h1>
              
              <div className="space-y-6 text-lg leading-relaxed">
                <p className="text-gray-700 bg-white/40 p-4 rounded-xl backdrop-blur-sm">
                  Isso do casamento foi mais para tirar um sorriso seu, clicou no não? Se não clicou, tenho algo para te falar. 
                  O botão não tinha um sistema, era impossível clicar nele, então essa era a pegadinha, agora fique com minha carta.
                </p>

                <p className="text-gray-700 bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  Desde a primeira vez que te vi na igreja, algo em mim mudou. Eu lembro bem daquele instante… não foi só sua 
                  beleza que me chamou atenção, mas o brilho diferente que vi em você, o brilho do Espírito Santo. E aquilo me 
                  marcou de um jeito que eu nunca esqueci.
                </p>

                <p className="text-gray-700 bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  Depois de meses, criei coragem de te mandar mensagem, e aí começamos a nos falar. Fomos conversando, aos poucos, 
                  no meu jeito meio desajeitado, tentando fazer tudo certo, tentando ir com calma… mas mesmo assim eu já não 
                  conseguia esconder de você que eu te amo.
                </p>

                <p className="text-gray-700 bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  Tem um dia que eu nunca esqueço: aquele congresso no ano passado. A gente ficou conversando e andando junto, 
                  e meu coração só queria ficar ali, ao seu lado, ouvindo sua voz e me perdendo no seu sorriso. Mas quando passamos 
                  em frente ao trabalho de um amigo meu, vi a galera lá e, não sei o que deu em mim, acabei me despedindo e indo 
                  até eles. Só que, sinceramente, tudo que eu queria era continuar do seu lado naquela noite. Quando cheguei nos 
                  meus amigos, não me aguentei e disse: "aquela ali é minha mulher, olha como ela tá linda". Eles riram, brincaram, 
                  mas eu estava só falando a verdade que queimava no meu peito.
                </p>

                <p className="text-gray-700 bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  Depois a vida me levou para longe, e eu tive que me afastar de você. Isso me doeu de um jeito que eu não sei nem 
                  explicar. Passei por dificuldades, pela minha saúde, e precisei voltar a morar com a minha mãe. Mas mesmo nesse 
                  tempo difícil, Deus foi fiel… e me permitiu voltar a falar com você, justamente quando eu mais precisava.
                </p>

                <p className="text-gray-700 bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  Hoje a gente não conversa tanto quanto eu gostaria, mas todos os dias que troco mensagens com você se tornam os 
                  melhores do meu dia. É quando esqueço dos problemas, quando meu sorriso nasce e fica comigo até eu dormir.
                </p>

                <p className="text-gray-700 bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  Você não sabe, mas eu oro por você todos os dias. Em cada oração, peço a Deus que cuide de você, que guie os 
                  seus passos, e que me ajude a estar mais perto de você. Porque, no fundo, é isso que eu quero: que seja você.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% { 
            transform: translateY(0) rotate(0deg) scale(0);
            opacity: 0;
          }
          10% {
            transform: translateY(-10vh) rotate(36deg) scale(1);
            opacity: 1;
          }
          90% {
            transform: translateY(-90vh) rotate(324deg) scale(1);
            opacity: 1;
          }
          100% { 
            transform: translateY(-100vh) rotate(360deg) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <DeclarationSite />
    </div>
  );
}

export default App;
