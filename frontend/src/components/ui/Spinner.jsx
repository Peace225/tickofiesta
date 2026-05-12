export default function Spinner({ size = 'md', className = '' }) {
  // Définition des tailles (y compris xl pour tes écrans de chargement complets)
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-[6px]'
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizeClass} 
          ${className}
          animate-spin 
          rounded-full 
          border-indigo-200/30 
          border-t-indigo-600
        `}
      />
    </div>
  );
}