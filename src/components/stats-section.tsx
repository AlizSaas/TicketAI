export function StatsSection() {
  const stats = [
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "50ms", label: "Average Response Time" },
    { number: "500+", label: "Companies Trust Us" },
    { number: "24/7", label: "Support Available" },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by Teams Worldwide</h2>
          <p className="text-xl text-gray-600">Join thousands of companies already using TicketFlow</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
