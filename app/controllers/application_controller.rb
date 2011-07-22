class ApplicationController < ActionController::Base
  protect_from_forgery
  helper_method :current_user

  private

  def require_user
    unless current_user
      redirect_to root_path
    end
  end

  def current_user
    return nil if session[:access_token].blank?
    begin
      foursquare = Foursquare::Base.new(session[:access_token])
      @current_user ||= foursquare.users.find("self")
    rescue Foursquare::InvalidAuth
      nil
    end
  end

  def foursquare
    unless current_user
      @foursquare ||= Foursquare::Base.new('LNKOBIXNHL0UWSYGJIX5K1Q1N0NZ4CHNB0N4G1RHT4RKW4FI', 'NGNH3G1XPHK0YUQV2PMMJO02F14JBDBOM2IM1M1Z5NFB5O0T')
    else
      @foursquare ||= Foursquare::Base.new(session[:access_token])
    end
  end
end
