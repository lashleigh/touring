Touring::Application.routes.draw do

  resources :trips do
    resources :days
  end
  match "trips/:trip_id/days/:id" => "days#show"
  match "users/:id/settings" => "users#settings" 
  match 'create_new_day' => 'days#create_new_day'
  resources :users
  resources :places

  match "/places/search_foursquare" => "places#search_foursquare"
  match "/places/save_foursquare"   => "places#save_foursquare"
  match "/days/add_tag"             => "days#add_tag"
  #match "/trips/:trip_id/days/:day_id" => "trips#show_day"

  match "/auth/:provider/callback" => "sessions#create"  
  match "/signout" => "sessions#destroy", :as => :signout

  root :to => "home#index"
end
