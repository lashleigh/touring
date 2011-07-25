class HomeController < ApplicationController
  def index
    #if current_user
    #  redirect_to current_user
    #end
    @trips = Trip.all
    @days = Day.all
  end
end

