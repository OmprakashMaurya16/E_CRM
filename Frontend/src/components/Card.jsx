const Card = ({ title, value, subtitle, icon, color }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {title}
        </p>

        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>

        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div
        className={`flex items-center justify-center h-12 w-12 rounded-full ${color}`}
      >
        {icon}
      </div>
    </div>
  );
};

export default Card;
