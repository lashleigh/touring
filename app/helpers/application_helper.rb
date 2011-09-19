module ApplicationHelper

  def distance_to_human(num)
    unit_system = @current_user ? @current_user.unit_system : 'IMPERIAL'
    if unit_system == "METRIC"
      num = num / 1000
      num = num > 10 ? num.round : num.round(1)
      return num.to_s+' km'
    else
      num = num/ 1621.371192
      num = num > 10 ? num.round : num.round(1)
      return num.to_s+" mi"
    end
  end

end
