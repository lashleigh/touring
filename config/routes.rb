Touring::Application.routes.draw do
  resources :trips
  resources :users
  resources :days
  resources :waypoints
  match "/waypoints/search_foursquare" => "waypoints#search_foursquare"
  match "/waypoints/save_foursquare" => "waypoints#save_foursquare"

  match "/auth/:provider/callback" => "sessions#create"  
  match "/signout" => "sessions#destroy", :as => :signout

  root :to => "home#index"
end
