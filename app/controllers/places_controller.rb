class PlacesController < ApplicationController
  # GET /places
  # GET /places.xml
  def search_foursquare
    res = foursquare.venues.search(:ll => params[:coords], :query => params[:query])
    render :text => res.to_json
  end

  def save_foursquare
    place = Place.create!
    fq = ActiveSupport::JSON.decode(params[:fq_hash])
    fq["category_array"] = fq["categories"].map {|c| c["name"] }
    place.import_from_fq(fq)

    render :text => place.as_json
  end

  def index
    @places = Place.all

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @places }
    end
  end

  # GET /places/1
  # GET /places/1.xml
  def show
    @place = Place.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @place }
    end
  end

  # GET /places/1/edit
  def edit
    @place = Place.find(params[:id])
  end

  # PUT /places/1
  # PUT /places/1.xml
  def update
    @place = Place.find(params[:id])

    respond_to do |format|
      if @place.update_attributes(params[:place])
        format.html { redirect_to(@place, :notice => 'Place was successfully updated.') }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @place.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /places/1
  # DELETE /places/1.xml
  def destroy
    @place = Place.find(params[:id])
    @place.destroy

    respond_to do |format|
      format.html { redirect_to(places_url) }
      format.xml  { head :ok }
    end
  end


end
