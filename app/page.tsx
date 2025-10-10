'use client';

import ProjectListView from './components/ProjectListView';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Botão flutuante para acessar a demo */}
      <Link 
        href="/demo-presence"
        className="fixed bottom-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 font-medium flex items-center gap-2"
      >
        🎭 Ver Demo de Cursores
      </Link>
      
      <ProjectListView />
    </>
  );
}