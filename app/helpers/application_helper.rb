module ApplicationHelper

  def distance_to_human(num)
    unit_system = @current_user ? @current_user.unit_system : 'IMPERIAL'
    if unit_system == "METRIC"
      return (num/ 1000).round(1).to_s + " km"
    else
      return (num/ 1621.371192).round(1).to_s+" mi";
    end
  end

end
