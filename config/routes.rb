Touring::Application.routes.draw do

  resources :trips do
    resources :days
  end
  match "trips/:trip_id/days/:id" => "days#show"
  match "users/:id/settings" => "users#settings" 
  resources :users
  resources :waypoints

  match "/waypoints/search_foursquare" => "waypoints#search_foursquare"
  match "/waypoints/save_foursquare"   => "waypoints#save_foursquare"
  match "/days/add_tag"                => "days#add_tag"
  #match "/trips/:trip_id/days/:day_id" => "trips#show_day"

  match "/auth/:provider/callback" => "sessions#create"  
  match "/signout" => "sessions#destroy", :as => :signout

  root :to => "home#index"
end
